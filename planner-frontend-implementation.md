# Planner — Implementation Results

Date: 2026-10-10

The frontend for the daily planner (`/planner`) is built and verified, built on the
`planner_entries` API and the date-range read filters shipped by the backend. This
file captures what landed so we can pick the work back up later.

## Status

- `npm run check`: 0 errors / 0 warnings
- `npm run build`: succeeds (adapter-node)
- `npm test`: 785 pass; 1 failure is the pre-existing, unrelated
  `tests/components/logic-leaves.test.ts > StatisticWidget > applies the requested
  color classes`
- Nothing committed

## What shipped

### Slice A — Shell
- `src/lib/types/planner.ts` — `PlannerEntry` + `CreatePlannerEntryRequest` /
  `UpdatePlannerEntryRequest` mirroring the API contract.
- `src/lib/config/apiRoutes.ts` —
  - `toQuery()` helper,
  - `planner.list/create/update/delete` ({from,to}|%d),
  - range builders on existing endpoints: `todos.listRange({due_from,due_to})`,
    `checkIn.listRange({from,to})`, `calendars.eventsRange(from,to)`.
- `src/lib/state/Planner.svelte.ts` — store: `stripStart`/`selectedDay`, 7-day strip,
  one parallel batch load per window (entries, todos, check-ins, events), entry CRUD,
  day/overdue/todo/event/check-in accessors. Uses `getAuth().apiService` (no own ApiService).
- `src/routes/planner/+layout.svelte` (`setPlanner()`) and `+page.svelte` (loads on mount).
- Registered as `FeatureType 'planner'`: `navigation.ts` (nav item, desktop/mobile order),
  `urls.planner`, `NavEntryIcon` (`calendar-clock`), Navigation store default `true`,
  Settings → Features toggle.

### Slice B — Read-only grid
- `src/lib/components/planner/PlannerTimegrid.svelte` — day timegrid: hour gutter,
  all-day strip, read-only calendar events positioned by start/duration, DAV
  end-exclusive clipping.
- `src/lib/components/planner/PlannerTodoColumn.svelte` — due todos + overdue bucket,
  check-off writes through the existing Todos API.

### Slice C — Editable blocks
- Empty-slot click → add modal pre-filled at that hour.
- Drag a block to move it (snap-to-15 via `CalendarDragService`).
- `src/lib/components/planner/PlannerEntryModal.svelte` — edit title/start/duration/
  all-day/color; delete (edit mode only).

### Slice D — Widgets
- `src/lib/components/planner/PlannerDiaryWidget.svelte` — link into `/notes/journal/[date]`.
- `src/lib/components/planner/PlannerCheckInWidget.svelte` — link into `/check-in/date/[date]`,
  with a "has data" dot.

### Slice E — Mobile + tests
- `src/lib/components/planner/PlannerMobileList.svelte` — mobile/tablet collapse to a
  tappable time-ordered list (includes todo column + widgets).
- `src/lib/services/PlannerService.ts` — pure logic (strip, date-key, entry/todo/overdue
  filters, DAV event day-membership via overlap-computation, minute→% geometry, labels).
- `tests/unit/services/PlannerService.test.ts` — 12 tests.

### i18n
- New `PlannerRecords` block (all four locales `en/de/es/fr`): title, today, add/edit
  entry, entries/no-entries, all_day, events, todos, overdue, journal, check_in,
  start, duration, save, cancel, delete, color, entry title, no_events, duration_hours.
- `nav.planner` added to all four locales.
- Type fallout fixed: `UserSettings`… no — this job: `NavigationRecords`, `PlannerRecords`,
  `LanguageFile`, WelcomeTour test fixture (planner feature flag), color key.

## Known gaps / next steps

1. **Resize dragging** — only move-drag + modal edits exist; drag-to-resize is not built.
2. **Todo column scope** — fetches due-in-strip todos + slices `due_at` for overdue;
   the handoff gotcha (`due_at` is ISO-8601 with time, slice `.slice(0,10)`) applies.
   No UI to create/edit todos from the planner yet.
3. **Journal content** — the diary widget links to the journal page; no inline
   content/snippet editor in the planner (journal owns that; marks endpoint only
   returns dates per the handoff).
4. **Drag persistence sandbox** — dragging calendar/todo items inside the planner is
   not implemented (v1 is planner-local only, per the brief).
5. **Check-in widget** is a summary/link; inline editor deferred.
6. **Visual/QA pass** — not rendered/verified in a browser (client-only SPA behind auth;
   no local backend in this worktree). Worth a `webapp-testing` pass when a backend is up.

## Cross-repo contract recap

- `GET /api/v1/planner/entries?from=&to=` — 7-day strip in one call.
- `POST /api/v1/planner/entries`, `PATCH/DELETE /api/v1/planner/entries/{id}`.
- Range filters: `GET /todos?due_from=&due_to=`, `GET /check-in?from=&to=`,
  `GET /calendars/events?from=&to=`.
- Hard rule: planner never mutates todos/events/journal/check-in; `todo_id` is an
  opaque reference (completion goes through the Todos API).