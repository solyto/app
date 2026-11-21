import { describe, it, expect } from 'vitest';
import GoalService from '$lib/services/GoalService';
import type { Goal } from '$lib/types/goal';

const service = new GoalService();

function goal(overrides: Partial<Goal> = {}, progress: Partial<Goal['progress']> = {}): Goal {
	return {
		id: 1,
		source: 'check_in_tracker',
		check_in_tracker_id: 1,
		period: 'week',
		comparison: 'at_least',
		target: 4,
		notify_when_reached: false,
		...overrides,
		progress: { current: null, met: false, period_start: '2026-11-16', period_end: '2026-11-22', history: [], ...progress }
	};
}

describe('periods', () => {
	it('counts yes/no and sports days over a week or a month only', () => {
		expect(service.periods('yes_no')).toEqual(['week', 'month']);
		expect(service.periods('sport')).toEqual(['week', 'month']);
		expect(service.periods('count')).toEqual(['day', 'week', 'month']);
		expect(service.periods('scale')).toEqual(['day', 'week', 'month']);
	});
});

describe('isValidTarget', () => {
	it.each([
		['yes_no', 'week', 7, true],
		['yes_no', 'week', 8, false],
		['yes_no', 'month', 31, true],
		['yes_no', 'week', 2.5, false],
		['yes_no', 'day', 1, false],
		['scale', 'day', 3.5, true],
		['scale', 'day', 0.5, false],
		['scale', 'week', 6, false],
		['count', 'day', 0, true],
		['count', 'day', 1.5, false]
	] as const)('%s per %s: %s → %s', (type, period, target, valid) => {
		expect(service.isValidTarget(type, period, target)).toBe(valid);
	});

	it('needs a target', () => {
		expect(service.isValidTarget('count', 'day', null)).toBe(false);
	});
});

describe('ratio', () => {
	it('fills the bar by the share of the target, capped at full', () => {
		expect(service.ratio(goal({}, { current: 2 }))).toBe(0.5);
		expect(service.ratio(goal({}, { current: 9 }))).toBe(1);
		expect(service.ratio(goal({}, { current: null }))).toBe(0);
		expect(service.ratio(goal({ target: 0 }, { current: 0 }))).toBe(0);
	});
});

describe('daysLeft', () => {
	it('counts the days left in the period, today included', () => {
		expect(service.daysLeft(goal(), new Date(2026, 10, 20, 15, 30))).toBe(3);
		expect(service.daysLeft(goal(), new Date(2026, 10, 22))).toBe(1);
	});

	it('has none for daily goals', () => {
		expect(service.daysLeft(goal({ period: 'day' }), new Date(2026, 10, 20))).toBeNull();
	});
});

describe('isAverage and scalePosition', () => {
	it('shows only 1–5 trackers on the scale', () => {
		expect(service.isAverage('scale')).toBe(true);
		expect(service.isAverage('count')).toBe(false);
		expect(service.isAverage('yes_no')).toBe(false);
	});

	it('places a value between 1 and 5 on the scale', () => {
		expect(service.scalePosition(1)).toBe(0);
		expect(service.scalePosition(3)).toBe(0.5);
		expect(service.scalePosition(5)).toBe(1);
		expect(service.scalePosition(1.5)).toBe(0.125);
	});
});
