import type { CalendarEvent } from '$lib/types/calendar';

export function getCalendarEventKey(item: CalendarEvent): string {
	return item.uri + '-' + (item.original_start_date ?? item.start_date)?.getTime();
}
