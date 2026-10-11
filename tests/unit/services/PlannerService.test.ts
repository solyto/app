import { describe, it, expect } from 'vitest';
import PlannerService from '$lib/services/PlannerService';
import type { PlannerEntry } from '$lib/types/planner';
import type { Todo } from '$lib/types/todo';
import type { CalendarEvent } from '$lib/types/calendar';

const service = new PlannerService();

function entry(overrides: Partial<PlannerEntry> = {}): PlannerEntry {
	return {
		id: 1,
		date: '2026-10-12',
		title: 'Gym',
		start_minutes: 540,
		duration_minutes: 60,
		is_all_day: false,
		color: null,
		todo_id: null,
		sort_order: 0,
		created_at: '',
		updated_at: '',
		...overrides
	};
}

function todo(overrides: Partial<Todo> = {}): Todo {
	return {
		id: 't1',
		title: 'Todo',
		description: '',
		link: null,
		priority: 'medium',
		status: 'pending',
		effort: null,
		progress: null,
		is_completed: false,
		due_at: '2026-10-12T09:00:00.000000Z',
		category: null,
		tags: [],
		subtasks: [],
		relevance: null,
		recurrence_frequency: null,
		recurrence_interval: 1,
		recurrence_ends_at: null,
		parent_task_id: null,
		auto_generated: false,
		created_at: '',
		updated_at: '',
		completed_at: '',
		...overrides
	};
}

function calendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
	return {
		id: 1,
		uri: 'evt-1',
		title: 'Meeting',
		description: '',
		location: '',
		start_date: new Date(2026, 9, 12, 10, 0),
		end_date: new Date(2026, 9, 12, 11, 0),
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
		etag: 'abc',
		...overrides
	};
}

function dayKey(date: Date): string {
	return service.dateKey(date);
}

describe('PlannerService', () => {
	describe('strip', () => {
		it('builds 7 days starting from the given day', () => {
			const strip = service.getStrip(new Date(2026, 9, 10));
			expect(strip).toHaveLength(7);
			expect(dayKey(strip[0])).toBe('2026-10-10');
			expect(dayKey(strip[6])).toBe('2026-10-16');
		});
	});

	describe('entries for date', () => {
		it('only returns entries whose date matches, case-insensitively exact', () => {
			const entries = [
				entry({ id: 1, date: '2026-10-12' }),
				entry({ id: 2, date: '2026-10-13' })
			];
			const result = service.getEntriesForDate(entries, new Date(2026, 9, 12));
			expect(result.map((e) => e.id)).toEqual([1]);
		});
	});

	describe('todos for date', () => {
		it('slices the ISO due_at day part to match the date', () => {
			const todos = [
				todo({ id: 'a', due_at: '2026-10-12T09:00:00.000000Z' }),
				todo({ id: 'b', due_at: '2026-10-13T00:00:00.000000Z' })
			];
			const result = service.getTodosForDate(todos, new Date(2026, 9, 12));
			expect(result.map((t) => t.id)).toEqual(['a']);
		});

		it('keeps completed todos in the same-day result', () => {
			const todos = [todo({ id: 'c', due_at: '2026-10-12T09:00:00', is_completed: true })];
			expect(service.getTodosForDate(todos, new Date(2026, 9, 12))).toHaveLength(1);
		});
	});

	describe('overdue todos', () => {
		it('returns uncompleted todos due before today', () => {
			const todos = [
				todo({ id: 'past', due_at: '2026-10-10T09:00:00' }),
				todo({ id: 'past-done', due_at: '2026-10-10T09:00:00', is_completed: true }),
				todo({ id: 'today', due_at: '2026-10-12T09:00:00' })
			];
			const result = service.getOverdueTodos(todos, new Date(2026, 9, 12));
			expect(result.map((t) => t.id)).toEqual(['past']);
		});
	});

	describe('events for date', () => {
		it('includes an event whose day matches its start', () => {
			const events = [calendarEvent()];
			expect(service.getEventsForDate(events, new Date(2026, 9, 12))).toHaveLength(1);
			expect(service.getEventsForDate(events, new Date(2026, 9, 13))).toHaveLength(0);
		});

		it('includes a span event that crosses the day (end-exclusive)', () => {
			const events = [
				calendarEvent({
					start_date: new Date(2026, 9, 12, 20, 0),
					end_date: new Date(2026, 9, 13, 2, 0)
				})
			];
			expect(service.getEventsForDate(events, new Date(2026, 9, 12))).toHaveLength(1);
			expect(service.getEventsForDate(events, new Date(2026, 9, 13))).toHaveLength(1);
		});

		it('excludes a timed event that ended at the start of the day', () => {
			const events = [
				calendarEvent({
					start_date: new Date(2026, 9, 11, 23, 0),
					end_date: new Date(2026, 9, 12, 0, 0)
				})
			];
			expect(service.getEventsForDate(events, new Date(2026, 9, 12))).toHaveLength(0);
		});
	});

	describe('event overlap minutes', () => {
		it('clips an overnight event to its portion within the day', () => {
			const event = calendarEvent({
				start_date: new Date(2026, 9, 12, 23, 0),
				end_date: new Date(2026, 9, 13, 1, 30)
			});
			const overlap = service.getEventOverlapMinutes(event, new Date(2026, 9, 12));
			expect(overlap).toEqual({ start: 23 * 60, end: 24 * 60 });
		});

		it('returns the full window for an event wholly inside the day', () => {
			const overlap = service.getEventOverlapMinutes(
				calendarEvent({
					start_date: new Date(2026, 9, 12, 10, 0),
					end_date: new Date(2026, 9, 12, 11, 0)
				}),
				new Date(2026, 9, 12)
			);
			expect(overlap).toEqual({ start: 600, end: 660 });
		});
	});

	describe('grid geometry', () => {
		it('maps minutes to percentages and back-formatting', () => {
			expect(service.minutesToPercent(720)).toBe(50);
			expect(service.minutesToLabel(540)).toBe('09:00');
			expect(service.minutesToLabel(90)).toBe('01:30');
		});

		it('clamps out-of-range minutes', () => {
			expect(service.minutesToPercent(1500)).toBe(100);
			expect(service.minutesToPercent(-1)).toBe(0);
		});
	});
});
