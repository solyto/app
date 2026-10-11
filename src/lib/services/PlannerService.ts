import type { PlannerEntry } from '$lib/types/planner';
import type { Todo } from '$lib/types/todo';
import type { CalendarEvent } from '$lib/types/calendar';
import { getDatePlusDays, getUrlFormat } from '$lib/helpers/DateHelper';

// Pure planner logic: day/entry resolution, todo + event filtering for a day,
// and grid geometry. Kept free of $state so it is unit-testable.
export default class PlannerService {
	static readonly DAYS_IN_STRIP = 7;

	// The 7-day planning strip, starting at `from` (inclusive).
	getStrip(from: Date): Date[] {
		const days: Date[] = [];
		for (let i = 0; i < PlannerService.DAYS_IN_STRIP; i++) {
			days.push(getDatePlusDays(from, i));
		}
		return days;
	}

	dateKey(date: Date): string {
		return getUrlFormat(date);
	}

	parseDateKey(key: string): Date | null {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
		const [y, m, d] = key.split('-').map(Number);
		return new Date(y, m - 1, d);
	}

	getEntriesForDate(entries: PlannerEntry[], date: Date): PlannerEntry[] {
		return entries.filter((entry) => entry.date === this.dateKey(date));
	}

	// Todos whose due date (taken from the ISO due_at day part) matches the day.
	// Completed todos are kept; the caller decides which to surface.
	getTodosForDate(todos: Todo[], date: Date): Todo[] {
		const key = this.dateKey(date);
		return todos.filter((todo) => (todo.due_at ?? '').slice(0, 10) === key);
	}

	// Overdue = due before today and not completed.
	getOverdueTodos(todos: Todo[], today: Date): Todo[] {
		const todayKey = this.dateKey(today);
		return todos.filter(
			(todo) => !todo.is_completed && (todo.due_at ?? '').slice(0, 10) < todayKey
		);
	}

	// Events that touch the given day (timed events end-exclusive, all-day
	// events without DTEND span a single day, per the calendar contract).
	getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
		return events.filter((event) => this.eventTouchesDay(event, date));
	}

	private eventTouchesDay(event: CalendarEvent, date: Date): boolean {
		return this.getEventOverlapMinutes(event, date) !== null;
	}

	// Minutes-from-midnight for an event's portion that falls within `date`.
	// Returns null when the event has no timed overlap with the day.
	getEventOverlapMinutes(
		event: CalendarEvent,
		date: Date
	): { start: number; end: number } | null {
		const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
		const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

		const start = Math.max(event.start_date.getTime(), dayStart.getTime());
		const end = Math.min(event.end_date.getTime(), dayEnd.getTime());

		if (end <= start) return null;

		return {
			start: Math.floor((start - dayStart.getTime()) / 60000),
			end: Math.floor((end - dayStart.getTime()) / 60000)
		};
	}

	toMinutesFromMidnight(date: Date): number {
		return date.getHours() * 60 + date.getMinutes();
	}

	// Grid geometry helpers
	minutesToPercent(minutes: number, dayMinutes = 1440): number {
		return (Math.min(Math.max(minutes, 0), dayMinutes) / dayMinutes) * 100;
	}

	minutesToLabel(minutes: number): string {
		const clamped = Math.min(Math.max(Math.round(minutes), 0), 1440);
		const h = Math.floor(clamped / 60);
		const m = clamped % 60;
		return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
	}
}
