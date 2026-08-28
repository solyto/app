# Implementation: calendar drag'n'drop

id: soil
status: open
developer:
date:

<!-- Produced by @developer after implementation. -->

## Summary

<!-- What was implemented, task by task. Reference task IDs. -->

## Changes

<!-- List of files changed and what changed in each. -->

## TASK-1 decision: drag-and-drop approach

**Chosen approach: custom pointer-events drag (no library, no native HTML5 DnD).**

Research summary:

- `svelte-dnd-action` (`dndzone`, used by Todo Kanban / ManageCalendars /
  ManageShortcuts) is list-reordering oriented: it operates on `items` arrays
  and `consider`/`finalize` index events. A calendar time grid positions
  events absolutely over a 24-hour × N-day surface; there is no "list index"
  to drop onto. The library's own author recommends implementing absolutely
  positioned drags from scratch when no list re-sorting is involved
  (isaacHagoel/svelte-dnd-action issue #354).
- Native HTML5 DnD (used by Note Navigation / LinkEntry) gives a browser-owned
  drag image, does not fire on touch, is inconsistent across browsers
  (drag-image throttling, `draggable` quirks on `<button>`), and makes the
  "ghost follows the pointer + live drop target" requirement hard to control.
- Pointer events give full control over both required UX behaviours: a
  fixed-position ghost that follows the pointer, and a precise drop-target
  indicator. Click-vs-drag is disambiguated with a movement threshold, so the
  existing click-to-edit keeps working. Best-practice guidance from
  calendar-drag implementations (svelte-calendar v0.14 release notes):
  throttle pointer moves to one per animation frame, measure the grid rect
  once per frame, keep the original block dimmed in place while dragging, and
  flush the pending frame on pointerup so the drop commits the newest position.

Drop-target model:

- **Week/day views** (`views/week/Day.svelte`, shared by WeekView + DayView,
  `fixedHeight=false`): drop target = (day column, hour slot). Pointer mapped
  to the column via `elementsFromPoint` + a `data-calendar-day` attribute on
  each column root; hour/minute from the pointer's Y relative to that column's
  rect using the grid fractions already in use (`h-3/30` all-day header,
  `h-1/27` per hour row). Timed events snap to **15-minute** slots and keep
  their duration; all-day events move date-only (target time ignored).
- **Month view** (`views/month/Day.svelte` cells as drop zones, `Entry.svelte`
  as drag source): date-only move — timed events keep their time of day,
  all-day events stay all-day. Drops on grayed-out (adjacent-month) days are
  rejected.
- **Ghost**: fixed-position clone of the dragged event that follows the
  pointer (grab-offset preserved), `pointer-events: none`, high z-index; the
  original block stays in place, dimmed.
- **Drop indicator**: in week/day, a bar in the target column spanning the
  event's new start→end (duration preserved), plus a subtle column tint; in
  month, the target cell is highlighted. Indicator hidden when the target is
  invalid (no column, grayed-out month day, or no-op = same date+time).
- **Recurring events**: a drop on a recurring occurrence opens the existing
  RecurrenceActionModal ("this occurrence" → `updateOccurrence` with
  `original_start_date`, "all occurrences" → `updateEvent`), mirroring the
  EventEdit contract exactly (`formatFloatingDate`, etag, `is_all_day`).
- **Gating**: DnD is active only when `fixedHeight=false` in week/day (mobile
  variants use `fixedHeight`); month DnD is active only in the desktop
  `MonthView` (the mobile month view is a separate component). List view is
  untouched (out of scope).

## Known issues / follow-ups

<!-- Anything that came up during implementation that wasn't in scope but should be tracked. -->
