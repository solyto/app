# Backlog: 20 Small smells from the refactor series

created: 2026-10-14

## What

- `helpers/DateHelper.ts` `eachDayBetween(start, end)` excludes `start` and includes `end`. Rename it, or have `CalendarEventService.groupByDay` compute the range it means, and drop the explaining JSDoc.
- Rule 10.1: the eight one-line JSDoc comments jobs 02/03/06 added in `helpers/DateHelper.ts` and `helpers/ColorHelper.ts`.
- `state/SessionMonitor.ts` is not a context store (no `$state`, no `setX/getX`). Pick one home for it and its test (`tests/unit/auth/` exists only for this file) (11.1, 15.2).
- The `new Date(x as string)` casts job 12 added in `state/Auth.svelte.ts` (×3), `state/CheckInData.svelte.ts`, `state/Calendars.svelte.ts` and `routes/check-in/date/[date]/+page.svelte` (×2). Each one turns `null` into 1970 silently (`expires_at`, `selectedDate`). Handle `null` explicitly.
- `KeyManager.helperKeyTimeouts` is bookkeeping held in `$state` (3.6, job 08).
- `NoteNavigationDesktop`/`NoteNavigationMobile` read `auth.user?.settings?.journal_enabled` in the component; it belongs on the store (3.3, job 11).
- `getIcon`/`getBarColor`/`getBarColorFood` are duplicated across the check-in views (2.2, job 13).
- `viewPoint.destroy()` is never called from the root layout (11.4, job 09).

## Why

These are places where a job fixed the named problem and left a smaller one, or wrote down a follow-up nobody picked up. Source: audit report §3.2, §5.2.

## Out of scope

Anything in backlogs 17 and 19.

## Notes

The `null` date casts are the only item that can change behaviour: decide per site what `null` should mean, and pin it with a test first. Everything else is a refactor; safety is tests, `check` and `lint`. Rules: 2.2, 3.3, 3.6, 10.1, 11.1, 11.4, 15.2.
