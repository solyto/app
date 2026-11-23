import { dateInTimeZone, floatingToUtc, getUrlFormat, parseUrlFormat } from '$lib/helpers/DateHelper';

export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export const WEEKDAYS: Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export type RecurrenceType = 'daily' | 'weekly' | 'monthly_date' | 'monthly_weekday' | 'yearly';

export type MonthlyOrdinal = 1 | 2 | 3 | 4;

export type RecurrenceEnd = 'never' | 'until' | 'count';

export interface RecurrenceSelection {
	type: RecurrenceType;
	weekdays: Weekday[];
	monthlyOrdinal: MonthlyOrdinal;
	monthlyWeekday: Weekday;
	end: RecurrenceEnd;
	until: string;
	count: number | null;
	preserved: string[];
}

export interface EndFormat {
	isAllDay: boolean;
	// All-day when the rule was read; only a switch changes the format of an untouched end.
	wasAllDay: boolean;
	timeZone: string;
}

interface RuleFields {
	freq: string;
	byDay: string | null;
	bySetPos: string | null;
	byMonthDay: string | null;
	byMonth: string | null;
	until: string | null;
	count: string | null;
	preserved: string[];
}

const MODELLED_KEYS = ['FREQ', 'BYDAY', 'BYSETPOS', 'BYMONTHDAY', 'BYMONTH'];

// UNTIL and COUNT stay in `preserved` so an untouched end is written back verbatim and in place.
const END_KEYS = ['UNTIL', 'COUNT'];

const READ_KEYS = [...MODELLED_KEYS, ...END_KEYS];

const UNTIL_DATE_LENGTH = 'YYYYMMDD'.length;

export default class RecurrenceRuleService {
	parse(rule: string | null, startDate: Date, timeZone: string): RecurrenceSelection | null {
		const selection = this.defaults(startDate);

		if (!rule) {
			return selection;
		}

		const fields = this.readFields(rule);

		if (!fields) {
			return null;
		}

		const end = this.readEnd(fields, timeZone);

		if (!end) {
			return null;
		}

		Object.assign(selection, end);
		selection.preserved = fields.preserved;

		switch (fields.freq) {
			case 'DAILY':
				return this.parseDaily(fields, selection);
			case 'WEEKLY':
				return this.parseWeekly(fields, selection);
			case 'MONTHLY':
				return this.parseMonthly(fields, selection, startDate);
			case 'YEARLY':
				return this.parseYearly(fields, selection, startDate);
			default:
				return null;
		}
	}

	build(selection: RecurrenceSelection, startDate: Date, endFormat: EndFormat): string {
		return [
			...this.modelledParts(selection, startDate),
			...this.preservedParts(selection, endFormat)
		].join(';');
	}

	defaultUntil(selection: RecurrenceSelection, startDate: Date): string {
		const until = new Date(startDate);

		if (selection.type === 'yearly') {
			until.setFullYear(until.getFullYear() + 1);
		} else {
			until.setMonth(until.getMonth() + 1);
		}

		return getUrlFormat(until);
	}

	untilNotBeforeStart(until: string, startDate: Date): string {
		const earliest = getUrlFormat(startDate);

		return until && until < earliest ? earliest : until;
	}

	effectiveWeekdays(selection: RecurrenceSelection, startDate: Date): Weekday[] {
		if (selection.weekdays.length === 0) {
			return [this.weekdayOf(startDate)];
		}

		return WEEKDAYS.filter((day) => selection.weekdays.includes(day));
	}

	private defaults(startDate: Date): RecurrenceSelection {
		return {
			type: 'daily',
			weekdays: [],
			monthlyOrdinal: Math.min(Math.ceil(startDate.getDate() / 7), 4) as MonthlyOrdinal,
			monthlyWeekday: this.weekdayOf(startDate),
			end: 'never',
			until: '',
			count: null,
			preserved: []
		};
	}

	private readFields(rule: string): RuleFields | null {
		const values = new Map<string, string>();
		const preserved: string[] = [];

		for (const part of rule.split(';')) {
			const separator = part.indexOf('=');

			if (separator <= 0) {
				return null;
			}

			const key = part.slice(0, separator);

			if (!MODELLED_KEYS.includes(key)) {
				preserved.push(part);
			}

			if (!READ_KEYS.includes(key)) {
				continue;
			}

			if (values.has(key)) {
				return null;
			}

			values.set(key, part.slice(separator + 1));
		}

		const freq = values.get('FREQ');

		if (!freq) {
			return null;
		}

		return {
			freq,
			byDay: values.get('BYDAY') ?? null,
			bySetPos: values.get('BYSETPOS') ?? null,
			byMonthDay: values.get('BYMONTHDAY') ?? null,
			byMonth: values.get('BYMONTH') ?? null,
			until: values.get('UNTIL') ?? null,
			count: values.get('COUNT') ?? null,
			preserved
		};
	}

	private readEnd(
		fields: RuleFields,
		timeZone: string
	): Pick<RecurrenceSelection, 'end' | 'until' | 'count'> | null {
		if (fields.until !== null && fields.count !== null) {
			return null;
		}

		if (fields.count !== null) {
			return /^[1-9]\d*$/.test(fields.count)
				? { end: 'count', until: '', count: Number(fields.count) }
				: null;
		}

		if (fields.until !== null) {
			const until = this.untilDate(fields.until, timeZone);

			return until ? { end: 'until', until, count: null } : null;
		}

		return { end: 'never', until: '', count: null };
	}

	private untilDate(value: string, timeZone: string): string | null {
		const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?$/.exec(value);

		if (!match) {
			return null;
		}

		const [, year, month, day, hours, minutes, seconds, utc] = match;
		const date = `${year}-${month}-${day}`;

		if (!this.isDate(date)) {
			return null;
		}

		return utc ? dateInTimeZone(new Date(`${date}T${hours}:${minutes}:${seconds}Z`), timeZone) : date;
	}

	private parseDaily(fields: RuleFields, selection: RecurrenceSelection): RecurrenceSelection | null {
		if (fields.byDay || fields.bySetPos || fields.byMonthDay || fields.byMonth) {
			return null;
		}

		return selection;
	}

	private parseWeekly(fields: RuleFields, selection: RecurrenceSelection): RecurrenceSelection | null {
		if (fields.bySetPos || fields.byMonthDay || fields.byMonth) {
			return null;
		}

		const weekdays = fields.byDay ? fields.byDay.split(',') : [];

		if (!weekdays.every((day) => this.isWeekday(day))) {
			return null;
		}

		selection.type = 'weekly';
		selection.weekdays = weekdays as Weekday[];

		return selection;
	}

	private parseMonthly(
		fields: RuleFields,
		selection: RecurrenceSelection,
		startDate: Date
	): RecurrenceSelection | null {
		if (fields.byMonth) {
			return null;
		}

		if (fields.byDay || fields.bySetPos) {
			return this.parseMonthlyWeekday(fields, selection);
		}

		if (fields.byMonthDay && fields.byMonthDay !== String(startDate.getDate())) {
			return null;
		}

		selection.type = 'monthly_date';

		return selection;
	}

	private parseMonthlyWeekday(
		fields: RuleFields,
		selection: RecurrenceSelection
	): RecurrenceSelection | null {
		if (fields.byMonthDay || !fields.byDay || !this.isWeekday(fields.byDay)) {
			return null;
		}

		if (!fields.bySetPos || !['1', '2', '3', '4'].includes(fields.bySetPos)) {
			return null;
		}

		selection.type = 'monthly_weekday';
		selection.monthlyWeekday = fields.byDay;
		selection.monthlyOrdinal = Number(fields.bySetPos) as MonthlyOrdinal;

		return selection;
	}

	private parseYearly(
		fields: RuleFields,
		selection: RecurrenceSelection,
		startDate: Date
	): RecurrenceSelection | null {
		if (fields.byDay || fields.bySetPos) {
			return null;
		}

		const hasDate = fields.byMonth !== null || fields.byMonthDay !== null;
		const matchesStart =
			fields.byMonth === String(startDate.getMonth() + 1) &&
			fields.byMonthDay === String(startDate.getDate());

		if (hasDate && !matchesStart) {
			return null;
		}

		selection.type = 'yearly';

		return selection;
	}

	private modelledParts(selection: RecurrenceSelection, startDate: Date): string[] {
		switch (selection.type) {
			case 'daily':
				return ['FREQ=DAILY'];
			case 'weekly':
				return ['FREQ=WEEKLY', 'BYDAY=' + this.effectiveWeekdays(selection, startDate).join(',')];
			case 'monthly_date':
				return ['FREQ=MONTHLY', 'BYMONTHDAY=' + startDate.getDate()];
			case 'monthly_weekday':
				return [
					'FREQ=MONTHLY',
					'BYDAY=' + selection.monthlyWeekday,
					'BYSETPOS=' + selection.monthlyOrdinal
				];
			case 'yearly':
				return [
					'FREQ=YEARLY',
					'BYMONTH=' + (startDate.getMonth() + 1),
					'BYMONTHDAY=' + startDate.getDate()
				];
		}
	}

	private preservedParts(selection: RecurrenceSelection, endFormat: EndFormat): string[] {
		const parts = selection.preserved.filter((part) => !this.isEndPart(part));
		const endPart = this.endPart(selection, endFormat);

		if (endPart === null) {
			return parts;
		}

		const position = selection.preserved.findIndex((part) => this.isEndPart(part));
		parts.splice(position === -1 ? parts.length : position, 0, endPart);

		return parts;
	}

	private endPart(selection: RecurrenceSelection, endFormat: EndFormat): string | null {
		const existing = selection.preserved.find((part) => this.isEndPart(part)) ?? null;

		switch (selection.end) {
			case 'never':
				return null;
			case 'count':
				return existing?.startsWith('COUNT=') ? existing : null;
			case 'until':
				return this.untilPart(selection.until, existing, endFormat);
		}
	}

	private untilPart(until: string, existing: string | null, endFormat: EndFormat): string | null {
		const existingUntil = existing?.startsWith('UNTIL=') ? existing.slice('UNTIL='.length) : null;

		if (!this.isDate(until)) {
			return existingUntil === null ? null : existing;
		}

		if (existingUntil !== null && this.isUnchangedUntil(existingUntil, until, endFormat)) {
			return existing;
		}

		if (endFormat.isAllDay) {
			return 'UNTIL=' + until.replaceAll('-', '');
		}

		const endOfDay = floatingToUtc(`${until}T23:59:59`, endFormat.timeZone);

		return 'UNTIL=' + endOfDay.toISOString().replace(/[-:]|\.\d{3}/g, '');
	}

	// Other apps write an all-day end in UTC, which read in a timezone can land on a neighbouring day; rewriting
	// it would drop or add an occurrence. RFC 5545 wants a DATE when all-day and UTC otherwise, so a switch rewrites.
	private isUnchangedUntil(existing: string, until: string, endFormat: EndFormat): boolean {
		const sameDate = this.untilDate(existing, endFormat.timeZone) === until;
		const allDaySwitched = endFormat.isAllDay !== endFormat.wasAllDay;
		const formatFits = (existing.length === UNTIL_DATE_LENGTH) === endFormat.isAllDay;

		return sameDate && (formatFits || !allDaySwitched);
	}

	private isDate(value: string): boolean {
		const parsed = parseUrlFormat(value);

		return parsed !== null && getUrlFormat(parsed) === value;
	}

	private isEndPart(part: string): boolean {
		return END_KEYS.some((key) => part.startsWith(key + '='));
	}

	private weekdayOf(date: Date): Weekday {
		return WEEKDAYS[(date.getDay() + 6) % 7];
	}

	private isWeekday(value: string): value is Weekday {
		return (WEEKDAYS as string[]).includes(value);
	}
}
