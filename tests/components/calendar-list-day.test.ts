import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import type { Calendars } from '$lib/state/Calendars.svelte';
import type { CalendarEvent } from '$lib/types/calendar';
import { formatTime } from '$lib/helpers/DateHelper';
import { renderWithContext } from './helpers/context';
import ListDayHarness from './helpers/ListDayHarness.svelte';

// jsdom can't parse color-mix(), the real tint; a plain colour makes the tint visible to the test.
vi.mock('$lib/helpers/ColorHelper', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/helpers/ColorHelper')>()),
	getEventBackgroundColor: () => 'rgb(1, 2, 3)'
}));

const day = new Date(2026, 10, 20);

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
	return {
		id: 1,
		uri: 'event-1',
		title: 'Event',
		description: '',
		location: '',
		start_date: new Date(2026, 10, 20, 10, 0),
		end_date: new Date(2026, 10, 20, 11, 0),
		is_all_day: false,
		is_recurring: false,
		recurrence_rule: null,
		recurrence_end: null,
		original_start_date: null,
		created_at: null,
		updated_at: null,
		calendar_id: 1,
		calendar_name: 'Personal',
		calendar_color: '#ff0000',
		etag: '',
		...overrides
	};
}

const holiday = event({ id: 1, uri: 'holiday', title: 'Holiday', is_all_day: true, start_date: new Date(2026, 10, 20), end_date: new Date(2026, 10, 21) });
const meeting = event({ id: 2, uri: 'meeting', title: 'Meeting' });

function renderDay(): Calendars {
	let calendars: Calendars | null = null;
	renderWithContext(ListDayHarness, { day, events: [holiday, meeting], onReady: (c: Calendars) => (calendars = c) });
	return calendars!;
}

describe('Calendar list view day', () => {
	it('tints all-day events only and shows the start time of timed events', () => {
		renderDay();

		const allDay = screen.getByRole('button', { name: /Holiday/ });
		const timed = screen.getByRole('button', { name: /Meeting/ });

		expect(allDay.style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(allDay.textContent).not.toContain(formatTime(holiday.start_date));
		expect(timed.style.backgroundColor).toBe('');
		expect(timed.textContent).toContain(formatTime(meeting.start_date));
	});

	it('opens the clicked event', async () => {
		const calendars = renderDay();
		const showSidebar = vi.spyOn(calendars, 'showSidebar').mockResolvedValue();

		await fireEvent.click(screen.getByRole('button', { name: /Meeting/ }));

		expect(showSidebar).toHaveBeenCalledWith(null, meeting);
	});
});
