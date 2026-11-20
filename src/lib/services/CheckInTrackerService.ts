import type { CheckIn, CheckInTracker, CheckInType, CheckInValue } from '$lib/types/check_in';
import { ALL_CHECK_IN_TRACKERS } from '$lib/types/check_in';
import type { WeekStart } from '$lib/types/auth';
import type { Goal } from '$lib/types/goal';
import { getStartOfWeek, getUrlFormat } from '$lib/helpers/DateHelper';

export type CheckInIndex = Map<string, Map<number, number>>;

export interface GoalProgress {
	current: number | null;
	met: boolean;
}

// food_amount is rated 1 (too little) to 5 (too much); 4 is the good amount.
const FOOD_AMOUNT_SCORE: Record<number, number> = { 1: 1.25, 2: 2.5, 3: 3.75, 4: 5, 5: 3 };

export default class CheckInTrackerService {
	index(values: CheckInValue[]): CheckInIndex {
		const index: CheckInIndex = new Map();
		for (const value of values) {
			let day = index.get(value.date);
			if (!day) {
				day = new Map();
				index.set(value.date, day);
			}
			day.set(value.tracker_id, value.value);
		}
		return index;
	}

	value(index: CheckInIndex, trackerId: number, date: string): number | null {
		return index.get(date)?.get(trackerId) ?? null;
	}

	isRating(tracker: CheckInTracker): boolean {
		return tracker.type === 'scale' || tracker.type === 'sport';
	}

	isLog(tracker: CheckInTracker): boolean {
		return tracker.type === 'yes_no' || tracker.type === 'count';
	}

	// The one-row-per-day shape the text summaries read; built-in trackers only.
	builtInDay(index: CheckInIndex, trackers: CheckInTracker[], date: string): CheckIn | null {
		const day = index.get(date);
		if (!day) return null;

		const row = Object.fromEntries(ALL_CHECK_IN_TRACKERS.map((key) => [key, null])) as Record<CheckInType, number | null>;
		let hasValue = false;
		for (const tracker of trackers) {
			if (tracker.key === null) continue;
			const value = day.get(tracker.id);
			if (value === undefined) continue;
			row[tracker.key] = value;
			hasValue = true;
		}

		return hasValue ? { id: 0, date, created_at: '', updated_at: '', ...row } : null;
	}

	ratingScore(tracker: CheckInTracker, value: number): number {
		return tracker.key === 'food_amount' ? (FOOD_AMOUNT_SCORE[value] ?? value) : value;
	}

	mean(tracker: CheckInTracker, index: CheckInIndex, dates: string[]): number {
		const values = dates
			.map((date) => this.value(index, tracker.id, date))
			.filter((value): value is number => value !== null && value !== 0)
			.map((value) => this.ratingScore(tracker, value));

		return values.reduce((a, b) => a + b, 0) / values.length;
	}

	totalMean(trackers: CheckInTracker[], index: CheckInIndex, dates: string[]): number {
		const means = trackers.map((tracker) => this.mean(tracker, index, dates)).filter((mean) => !isNaN(mean));
		return means.length > 0 ? means.reduce((a, b) => a + b, 0) / means.length : NaN;
	}

	scored(trackers: CheckInTracker[]): CheckInTracker[] {
		return trackers.filter((tracker) => tracker.enabled && tracker.type === 'scale' && tracker.scored);
	}

	goalDates(goal: Goal, today: Date, weekStart: WeekStart): string[] {
		if (goal.period === 'day') return [getUrlFormat(today)];

		const start =
			goal.period === 'week'
				? getStartOfWeek(today, weekStart)
				: new Date(today.getFullYear(), today.getMonth(), 1);

		const dates: string[] = [];
		for (const day = new Date(start); day <= today; day.setDate(day.getDate() + 1)) {
			dates.push(getUrlFormat(day));
		}
		return dates;
	}

	// Progress up to and including `today`, from the loaded values, so it follows edits right away.
	goalProgress(goal: Goal, tracker: CheckInTracker, index: CheckInIndex, today: Date, weekStart: WeekStart): GoalProgress {
		const values = this.goalDates(goal, today, weekStart)
			.map((date) => this.value(index, tracker.id, date))
			.filter((value): value is number => value !== null);

		const current = this.measure(tracker, values);
		// Nothing to measure is never met, as on the server.
		if (current === null) return { current: null, met: false };

		return { current, met: goal.comparison === 'at_least' ? current >= goal.target : current <= goal.target };
	}

	// What a goal counts: days done for yes/no and sports, the total for counts, the average for 1–5.
	private measure(tracker: CheckInTracker, values: number[]): number | null {
		switch (tracker.type) {
			case 'yes_no':
			case 'sport':
				return values.length;
			case 'count':
				return values.reduce((a, b) => a + b, 0);
			case 'scale': {
				const rated = values.filter((value) => value > 0);
				return rated.length === 0 ? null : rated.reduce((a, b) => a + b, 0) / rated.length;
			}
		}
	}
}
