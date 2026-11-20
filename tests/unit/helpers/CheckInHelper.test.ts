import { describe, it, expect } from 'vitest';
import { getScoreColor, goalProgressText, trackerLabel } from '$lib/helpers/CheckInHelper';
import type { CheckInTracker } from '$lib/types/check_in';
import type { Goal } from '$lib/types/goal';
import type { CheckInRecords } from '$lib/types/translation';

function tracker(overrides: Partial<CheckInTracker> = {}): CheckInTracker {
	return {
		id: 1,
		key: null,
		name: 'Meditated',
		type: 'yes_no',
		icon: 'flower-2',
		position: 0,
		enabled: true,
		scored: false,
		...overrides
	};
}

function goal(overrides: Partial<Goal> = {}): Goal {
	return {
		id: 1,
		source: 'check_in_tracker',
		check_in_tracker_id: 1,
		period: 'week',
		comparison: 'at_least',
		target: 5,
		notify_when_reached: false,
		progress: { current: null, met: false, period_start: '2026-10-12', period_end: '2026-10-18', history: [] },
		...overrides
	};
}

describe('getScoreColor', () => {
	it.each([
		[5, 'bg-c-success'],
		[4, 'bg-c-success'],
		[3.99, 'bg-c-primary'],
		[3, 'bg-c-primary'],
		[2.5, 'bg-c-warning'],
		[2, 'bg-c-warning'],
		[1.75, 'bg-c-action'],
		[1.5, 'bg-c-action'],
		[1.49, 'bg-c-danger'],
		[1, 'bg-c-danger']
	])('colors %s as %s', (value, expected) => {
		expect(getScoreColor(value)).toBe(expected);
	});
});

describe('trackerLabel', () => {
	const texts = { mood: 'Stimmung' } as CheckInRecords;

	it('names built-in trackers by their translation', () => {
		expect(trackerLabel(tracker({ key: 'mood', name: null, type: 'scale' }), texts)).toBe('Stimmung');
	});

	it('names own trackers by the name the user gave them', () => {
		expect(trackerLabel(tracker(), texts)).toBe('Meditated');
	});
});

describe('goalProgressText', () => {
	const texts = { goal_today: 'today', goal_this_week: 'this week', goal_this_month: 'this month' } as CheckInRecords;

	it('shows days or counts as whole numbers', () => {
		expect(goalProgressText(goal(), tracker(), { current: 3, met: false }, texts)).toBe('3 / 5 this week');
	});

	it('shows a 1–5 average with one decimal and marks an "at most" target', () => {
		const g = goal({ period: 'month', comparison: 'at_most', target: 2 });

		expect(goalProgressText(g, tracker({ type: 'scale' }), { current: 1.75, met: true }, texts)).toBe('1.8 / ≤ 2.0 this month');
	});

	it('shows a dash when there is nothing to measure yet', () => {
		const g = goal({ period: 'day', target: 4 });

		expect(goalProgressText(g, tracker({ type: 'scale' }), { current: null, met: false }, texts)).toBe('– / 4.0 today');
	});
});
