# Standards backlog

Concrete cleanups found while writing `docs/STANDARDS.md`. Each item names
the rule it serves and is sized for one commit unless marked otherwise.
Nothing here is a rule; the rules are in `STANDARDS.md`. Tick items off as
they land, and delete this file when it is empty.

Counts are from 2026-10-12 and are reproducible with the greps given in the
rule's "Check" line.

## Mechanical (grep, replace, done)

- [ ] `tsconfig.json`: set `"noUnusedParameters": true` (rule 12.1). `tsc`
      reports three hits: `Calendars.svelte.ts:117` (`month`, `year` of
      `loadEvents`), `Notes.svelte.ts:392` (`note`). Then run `npm run check`
      for hits inside `.svelte` scripts, count unknown.
- [ ] `calendars/EventEdit.svelte:90`: remove leftover `console.log`.
- [ ] `keyHandlers = $state<…>({…})` → plain `let` in 35 components
      (rule 3.6; target shape in 9.1).
- [ ] `{@const Icon = x.icon}` → `<x.icon />` wherever it appears (rule 1.5).
- [ ] 7 uses of `$derived(() => …)` → `$derived.by` or a plain function
      (`time-tracking/DashboardView`, `time-tracking/StatisticsView`, …).
- [ ] 26 stores with field-initialiser collaborators (`auth = getAuth();`,
      including `Translation`) → constructor parameters with defaults, as in
      `Todos` (rule 15.2). One pass; `new X()` keeps working, so no call sites
      change.
- [ ] 6 failing tests (pre-existing): five in
      `tests/unit/helpers/DateHelperExtended.test.ts` pin "today" to August
      2025; one in `tests/components/logic-leaves.test.ts` (`StatisticWidget`
      colour classes) no longer matches the markup.
- [ ] Move `src/lib/KeyManager.svelte.ts` → `src/lib/state/KeyManager.svelte.ts`
      and fix 38 imports (rule 11.1).
- [ ] 16 ternaries inside `class="…"` strings → `class:` directive or array
      form (rule 1.3; grep `class="[^"]*{[^}]*$`).
- [ ] `Day.svelte` and `CalendarMarks.svelte` fail `npm run lint` (hand-formatted
      attributes). `CalendarMarks`: add the `INACTIVE` const (3.5). `Day.svelte`:
      helpers for the style values (1.1).

## Extract to helpers (small, each removes several copies)

- [ ] `eventBackgroundColor(color)` / `eventBorderColor(color)` in
      `helpers/ColorHelper.ts`; replace the colour-mix expression in 10 places
      across 8 calendar files (rule 2.1).
- [ ] `isOffHour(hour)`; replace 5 copies in `week/Day`, `week/MobileWeekView`,
      `day/MobileDayView` (rule 2.2).
- [ ] `getHoursOfDay()` in `DateHelper`; replace 6 copies (5 calendar views,
      `forms/TimePicker`) (rule 2.2).
- [ ] `Viewpoint.keyboardHeight`; replace the `visualViewport` block in
      `BottomSheetModal`, `BottomSheetConfirmationModal`, `TipTapEditor`
      (rule 2.4).
- [ ] `eachDayBetween(start, end)` in `DateHelper` for the multi-day loop in
      `Calendars.loadEvents()` (rule 12.4).
- [ ] `parseDateSlug` from `calendars/dnd/CalendarDragState.svelte.ts` →
      `DateHelper`, next to `formatDate` (rule 11.2).
- [ ] `WeekView` and `MobileWeekView` `onMount` both re-implement
      `Calendars.goToToday()`; call it instead.

## Rewrites (one component or method each)

- [ ] `calendars/views/week/MobileWeekView.svelte`: replace the effect +
      `prevYear`/`prevWeek` with the sibling's one-line `$derived`; use
      `day.weekday`; drop `getWeekdayShort`; one const for the column width
      (rules 5.5, 2.3, 2.2, 6.1).
- [ ] `calendars/views/week/Day.svelte`: `isOffHour` instead of `@const`;
      `class:` instead of the folded ternary; one snippet for the two event
      buttons; style helpers (rules 1.3, 1.5, 1.6, 1.1). Also the file with
      the most `$derived` (9); review against section 3.
- [ ] `calendars/dnd/CalendarDragGhost.svelte`: render once in
      `WeekView`/`MonthView`, drop the `sourceDateSlug` prop and the dead
      `data-calendar-drag-ghost` attribute; `ghostStyle()` helper
      (rules 1.7, 1.8, 1.9).
- [ ] `todos/props/Recurrence.svelte`: `NumberInput`, `DateInput`, `TextButton`,
      `InlineDeleteButton`; `use:portalToBody` for the popover; `ts.get` for
      `Every`, `occurrence(s)`, `Cancel`, `Save`; move the `find(…)?.label`
      expression out of markup (rules 7.x, 8.1, 1.1).
- [ ] `Calendars.loadEvents()`: drop the unused parameters; `CalendarEventResponse`
      type + `fromApi()`; `groupByDay()` in a `CalendarEventService` with tests;
      plain `Date` instead of `SvelteDate` (rules 12.1–12.4, 14.1).
- [ ] `state/Auth.svelte.ts` (from commit 2df74d2): `destroy()` for the
      session monitor's listeners and interval (11.4); move the monitor into
      its own class (11.5); replace the layout's `wasLoggedIn` effect with an
      event the store exposes (5.6); strip narrating comments, keep the two
      why-comments named in 10.1; `res.data?.data` double unwrap.
- [ ] `services/ApiService.ts`: rebuild headers through the existing header
      functions instead of the `init.headers as Record<string, string>` cast in
      `fetchWithRecovery`; strip narrating comments (10.1).
- [ ] `routes/+layout.svelte`: remove `if (!browser) return` inside `$effect`.
- [ ] `libraries/shared/ShelfView.svelte`: add `ArrowLeft`/`ArrowRight` to
      `SupportedKey` and `KeyManager`, drop the raw `window` listener (9.2).

- [ ] Direct `fetch` outside `ApiService` (rule 15.3): `Calendars.svelte.ts:531,613,622`,
      `weather/ManageWeatherCity.svelte:31`, `settings/ExportSettings.svelte:97`.
      Add the needed method to `ApiService` and route them through it.

## Larger (a feature's worth)

- [ ] `calendars/ChooseRecurrenceRule.svelte`: `RecurrenceRuleService` with
      `parse`/`build` and tests; one `RecurrenceSelection` value bound to the
      parent; no effects; `{#each}` over the day options; all labels through
      `ts.get` (section 13, rules 5.1, 8.1). Note the current version drops
      `INTERVAL`/`UNTIL` from existing rules on open, which is a data bug.
- [ ] Calendar drag feature: `state/CalendarDrag.svelte.ts` store instead of the
      module-level `$state`; `use:draggableEvent` action for the pointer wiring;
      `Object.assign(this, INITIAL)` reset (rules 11.1–11.3).
- [ ] `libraries/shared/SpineView.svelte` and `LibrarySearchModal.svelte`:
      the `@const` stacks become child components (rule 1.5).
- [ ] `SvelteDate` cleanup: 16 importing files; keep it only where a setter is
      called on the value (14.1).
- [ ] ~8 components outside `state/` still doing `new ApiService(auth.getToken())`
      (listed as a follow-up in the 2df74d2 job verdict); use `auth.apiService`.

## Audits (read, then decide per hit)

- [ ] 29 files with `$effect`: each must be a 5.2 case (external side effect
      with cleanup). `ChooseRecurrenceRule` is the only one with two.
- [ ] 19 files with raw `<input>` outside `forms/`: each is a 7.4 case or a
      violation. `Recurrence.svelte` has 8, `Status.svelte` 6.
- [ ] Components with 5+ `$derived`: `week/Day` (9), `time-tracking/StatisticsView`
      (6), `notes/NoteNavigationMobile` (6), `time-tracking/DashboardView` (5),
      `notes/NoteNavigationDesktop` (5), `month/MobileMonthView` (5). Section 3.
- [ ] Comment-heavy files against 10.1: `state/Auth.svelte.ts` (36 lines),
      `services/ApiService.ts` (13), `state/Notes.svelte.ts` (6),
      `settings/notifications/ManagePushNotifications.svelte` (6),
      `calendars/dnd/CalendarDragState.svelte.ts` (6). `MusicTheory/*` is a
      separate question (domain math).

## Decisions still to make (not code)

