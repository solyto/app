# Backlog: 17 Calendar second pass

created: 2026-10-14

## What

The follow-ups and open questions jobs 04 and 06 left in the calendar:

- `calendars/views/week/Day.svelte`: one named handler for the two identical `onclick={async () => { await calendars.showSidebar(date); }}` (4.1); drop the redundant `{#if …entries.length > 0}` around the `{#each}` of the same list.
- Move `computeTarget()` out of `Day.svelte` into `CalendarDragService`, next to `snapToMinutes`, with the grid fractions `3/30` and `1/27` as named constants. They also appear in `getIndicatorTop()` and the `desktopRows` string (job 06 Q3).
- Move `getCalendarEventKey` from `state/CalendarDrag.svelte.ts` to `helpers/` (15.8) and use it for the nine inline `item.uri + '-' + (…)?.getTime()` key expressions across the calendar views.
- `helpers/CalendarDragHelper.ts`: replace `drag.suppressClick = false` with a store mutator; narrow the `(el as HTMLElement).closest(…)` cast to the return value.
- Merge `CalendarDropTarget` (`services/CalendarDragService.ts`) and `CalendarDragTarget` (`state/CalendarDrag.svelte.ts`); they have the same three fields (job 06 Q4).
- `Calendars.getWidgetEvents`: route through `fromApi()` instead of `res.data as CalendarEvent[]` (job 04 follow-up).
- `Calendars` next/previous day: `addDays(date, 1)` instead of mutate-and-rewrap (12.4).
- `Calendars.goToToday()`: the ISO-year bug noted in job 03 (week 1 / week 52–53 around New Year).

## Why

These are the smaller problems the calendar jobs left behind. The duplicate key expression and the magic fractions in particular will drift. Source: audit report §3.2, §6.5.

## Out of scope

Splitting the `Calendars` store (backlog 18). Making `WeekView`/`MobileWeekView` call `goToToday()`, which the owner dropped in job 03.

## Notes

Tests first for `computeTarget` once it is in the service, and for the `goToToday` year boundary (Dec 29–Jan 4 dates). Manual check: drag ghost position in day/week/month view, desktop and mobile, since no API was reachable in jobs 03/06. Rules: 1.6, 2.1, 4.1, 12.4, 15.8.
