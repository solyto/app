# Verdict: calendar drag'n'drop

id: soil
status: open
reviewer:
date: 2026-08-28

<!-- Produced by @reviewer and/or @security after implementation. -->

## Review

Reviewed against `git diff main...HEAD` on branch `feature/soil_calendar-drag-n-drop` (baseBranch `main` per `.manigot/manigot.json`). All changed files were read in full; no changes outside the task list were found (the uncommitted `M AGENTS.md` is the read-only manigot mount artifact, not part of this job).

Note on verification: this session's git shim only permits git commands, and `node_modules` is absent in the workspace, so I could not independently re-run `npm run check` / `npm test` / `npm run build` or the Playwright checks. The developer's reported results (0 check errors, 708 tests passing with 1 pre-existing `logic-leaves.test.ts` failure, build success, 21/21 stub-backend Playwright checks) are plausible and consistent with the code, but unverified here. There is no `screenshots/render-report.md` in the job dir.

TASK-1: PASS
notes: Decision recorded in implementation.md (custom pointer-events drag; 15-min snapping; ghost follows pointer; all-day date-only; grayed-out-month-day rejection; recurring via RecurrenceActionModal). The choice is sound: svelte-dnd-action is list-reordering oriented and doesn't fit an absolutely-positioned time grid; native HTML5 DnD can't satisfy the "ghost follows pointer + live indicator" requirement. The implementation matches the recorded decision.

TASK-2: PASS
notes: `src/lib/services/CalendarDragService.ts` — `snapToMinutes` (15-min default), `buildMoveRequest` preserves duration/all-day/recurrence semantics and returns null for no-op drops. Request contract matches EventEdit exactly (`formatFloatingDate`, etag, is_all_day, recurrence fields). `tests/unit/services/CalendarDragService.test.ts` (12 tests) covers timed/all-day/no-op/midnight-crossing/no-end-date/recurring cases. Solid.

TASK-3: PASS
notes: `Calendars.svelte.ts` — `moveEvent` / `applyEventMove` / `resolvePendingMove` / `cancelPendingMove` / `pendingMove` state mirror the EventEdit etag/`formatFloatingDate`/`original_start_date` contract; recurring occurrences are deferred to the modal, series master (original_start_date null) updates directly — same `isRecurring()` semantics as EventEdit. 8 store tests cover the flow incl. failure and no-op paths.

TASK-4: PARTIAL
notes: `views/week/Day.svelte` + `views/dnd/CalendarDragState.svelte.ts` + `CalendarDragGhost.svelte` implement pointer-driven drag with 5px threshold, pointer capture, rAF-throttled moves, click suppression (correctly ordered: the browser's compatibility click fires synchronously after pointerup, before the `setTimeout(0)` reset), source dimming, drop indicator, and the `!fixedHeight` gate. The drop mapping is pixel-accurate to the rendered grid: 24 hour rows × `h-1/27` + header `h-3/30` ≈ 98.9% of the column, so no flex-shrink distortion — `hourHeight = rect.height * (1/27)` matches the real rows. BLOCKER: `computeTarget` accepts drops on days of the adjacent month (first/last week of the loaded month); after the move, `updateEvent` → `loadEvents()` reloads only `currentYear-currentMonth` (`Calendars.svelte.ts:111-117` ignores its params), so the moved event's new start_date is outside the reloaded range and the event silently vanishes from the view. Fix: reject adjacent-month drops in week view `computeTarget` (mirroring the month view's grayed-day rejection) or make the reload cover the target date. Minor non-blocking notes: a timed event dropped on the all-day header area snaps to 00:00 (indicator shows it consistently, but it's a surprising result); a long late-night timed drop (e.g. 23:00 + 4h) renders the indicator past the column bottom (top+height > 100%).

TASK-5: PASS
notes: `views/month/Entry.svelte` (drag source) + `views/month/Day.svelte` (drop zones) — date-only moves keep the timed event's time of day; grayed-out (adjacent-month) cells rejected via `data-grayed`; hidden-calendar filtering and click-to-edit preserved; the desktop-only gating holds because `MobileMonthView` is a separate component that does not use `Entry`.

TASK-6: PASS
notes: `RecurrenceActionModal` gained `'move'` (new `recurring_move_question` string); `routes/calendar/+page.svelte` renders it off `calendars.pendingMove`, resolving this-occurrence via `updateOccurrence(original_start_date)` and all-occurrences via `updateEvent` — the same contract EventEdit uses. Escape/cancel clears `pendingMove`. Edge case (both the edit-sidebar modal and the move modal open at once would overlap — both z-70 overlays) is minor and hard to hit.

TASK-7: PASS
notes: `calendar.entry_move_error` + `calendar.recurring_move_question` added to en/de/es/fr and `CalendarRecords` in `translation.ts`. All four languages in sync.

TASK-8: PARTIAL
notes: Reported: `npm ci` (no new packages), `npm run check` 0 errors, `npm test` 708 passed (1 pre-existing `logic-leaves.test.ts` failure), `npm run build` success, 21/21 Playwright checks against a throwaway stub backend (real backend unavailable). I could not re-run any of this in this session (git-only shim; no node_modules). Stub-backend e2e validates PUT payloads and flows but not real backend semantics, and it evidently did not surface the adjacent-month week-view issue in TASK-4 (client-side reload behavior). No render report/screenshots exist in the job dir.

## Security

none — no tokens/secrets touched; the change is client-side DOM/API logic reusing the existing authed `ApiService` (Bearer token, etag-conflict handling preserved).

## Overall

NEEDS WORK

Blocker before merge:
- Week view drops onto adjacent-month days (first/last ISO week of the loaded month) move the event server-side but the post-move reload only fetches `currentYear-currentMonth` events (`src/lib/state/Calendars.svelte.ts:111-117`), so the moved event disappears from the UI with no error. Either reject such drops in `computeTarget` in `src/lib/components/calendars/views/week/Day.svelte` (consistent with the month view's grayed-day rejection) or reload the target month/date after the move.

Non-blocking notes (not required for merge): tablet viewports render the `Mobile*View` components (pre-existing `CalendarView` logic), so tablets get no DnD despite the "desktop/tablet" wording in tasks.md — the fixedHeight/mobile-component gating follows the explicit "mobile views are a follow-up" clause and the TASK-4 gate instruction, but the tasks.md wording is internally inconsistent; also, the verification evidence for TASK-8 could not be reproduced in this review session.