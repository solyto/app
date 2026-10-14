import { describe, it, expect } from 'vitest';
import { getCalendarEventKey } from '$lib/helpers/CalendarEventHelper';
import type { CalendarEvent } from '$lib/types/calendar';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
	return {
		id: 1,
		uri: 'event-1.ics',
		title: 'Meeting',
		description: '',
		location: '',
		start_date: new Date('2026-10-13T09:00:00Z'),
		end_date: new Date('2026-10-13T10:00:00Z'),
		is_all_day: false,
		is_recurring: false,
		recurrence_rule: null,
		recurrence_end: null,
		original_start_date: null,
		created_at: null,
		updated_at: null,
		calendar_id: 1,
		calendar_name: 'Work',
		calendar_color: '#ff0000',
		etag: 'etag',
		...overrides
	};
}

describe('getCalendarEventKey', () => {
	it('combines the uri with the start time', () => {
		const event = makeEvent();
		expect(getCalendarEventKey(event)).toBe('event-1.ics-' + event.start_date.getTime());
	});

	it('uses the original start date of a recurrence instance', () => {
		const original = new Date('2026-10-06T09:00:00Z');
		expect(getCalendarEventKey(makeEvent({ original_start_date: original }))).toBe(
			'event-1.ics-' + original.getTime()
		);
	});

	it('gives two instances of one recurring event different keys', () => {
		const first = makeEvent({ original_start_date: new Date('2026-10-06T09:00:00Z') });
		const second = makeEvent({ original_start_date: new Date('2026-10-13T09:00:00Z') });
		expect(getCalendarEventKey(first)).not.toBe(getCalendarEventKey(second));
	});
});
