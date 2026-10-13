import { setContext, getContext } from 'svelte';
import type { CalendarEvent } from '$lib/types/calendar';

export interface CalendarDragGhost {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface CalendarDragTarget {
	date: Date;
	hour: number;
	minute: number;
}

const INITIAL = {
	active: false,
	event: null,
	sourceDateSlug: null,
	sourceKey: null,
	ghost: null,
	target: null,
	suppressClick: false
};

export function getCalendarEventKey(item: CalendarEvent): string {
	return item.uri + '-' + (item.original_start_date ?? item.start_date)?.getTime();
}

export class CalendarDrag {
	active = $state<boolean>(INITIAL.active);
	event = $state<CalendarEvent | null>(INITIAL.event);
	sourceDateSlug = $state<string | null>(INITIAL.sourceDateSlug);
	sourceKey = $state<string | null>(INITIAL.sourceKey);
	ghost = $state<CalendarDragGhost | null>(INITIAL.ghost);
	target = $state<CalendarDragTarget | null>(INITIAL.target);
	suppressClick = $state<boolean>(INITIAL.suppressClick);

	begin(
		event: CalendarEvent,
		sourceDateSlug: string,
		ghost: CalendarDragGhost,
		target: CalendarDragTarget | null
	): void {
		Object.assign(this, INITIAL, {
			active: true,
			event,
			sourceDateSlug,
			sourceKey: getCalendarEventKey(event),
			ghost,
			target
		});
	}

	update(ghost: CalendarDragGhost, target: CalendarDragTarget | null): void {
		if (!this.active) return;
		this.ghost = ghost;
		this.target = target;
	}

	finish(): void {
		Object.assign(this, INITIAL, { suppressClick: true });
	}

	cancel(): void {
		Object.assign(this, INITIAL);
	}

	consumeClick(): boolean {
		const suppress = this.suppressClick;
		this.suppressClick = false;
		return suppress;
	}

	isDragged(item: CalendarEvent): boolean {
		return this.active && this.sourceKey === getCalendarEventKey(item);
	}
}

const CALENDAR_DRAG_KEY = Symbol('SOLYTO_CALENDAR_DRAG');

export function setCalendarDrag(): CalendarDrag {
	return setContext(CALENDAR_DRAG_KEY, new CalendarDrag());
}

export function getCalendarDrag(): CalendarDrag {
	return getContext<CalendarDrag>(CALENDAR_DRAG_KEY);
}
