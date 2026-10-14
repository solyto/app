# Backlog: 15 Mechanical markup cleanup

created: 2026-10-14

## What

The greppable leftovers that never got a job:

- Rule 4.1: 19 `<span role="button">` in 14 files → `<button>`. `CategoryHeader` (4), `CreateModal` (2), `TodoNavigationDesktop` (2), and one each in `ChooseCalendar`, `AddressBook`, `ChooseAddressBook`, `ContactDetail`, `NoteNavigationCategoryRenderer`, `Description`, `Link`, `Subtask`, `Title`, `CompactEntry`, `HelpTooltip`.
- Rule 1.3: 14 class ternaries folded over lines (grep `class="[^"]*\{[^}]*$`) → `class:` or array form. Three identical copies in `todos/props/Effort.svelte`, two in `ui/Card.svelte`, the rest single.
- Rule 1.1 / 2.1: the same folded progress-bar `style` in `contacts/ImportModal.svelte` and `calendars/ImportModal.svelte`.
- Rule 2.1: `color-mix(in srgb, var(--color-c-primary) 12%, var(--color-c-bg))` pasted into `WeekView`, `MonthView`, `DayView`, `ListView`.
- Rule 1.5: `{@render icon({ class })}` in `ui/Card.svelte`, `ui/CardButton.svelte`, `libraries/LibraryNavigationEntry.svelte` → `<Icon class="…" />` with the prop destructured as `icon: Icon`.
- Rule 8.1: literal "Recurrence" in `todos/actions/TodoCreate.svelte` and "Download failed." in `settings/ExportSettings.svelte` → `ts.get`, all four locales.
- Orphaned i18n key `enable_email_notifications` in all four tables.
- Rule 10.1: section-separator comments in `libraries/shared/ShelfView.svelte`.

## Why

All of these are listed in `docs/STANDARDS.md` with a grep, and none moved during jobs 01–13. Source: audit report §5.1, §5.2.

## Out of scope

Any behaviour change. Other markup in the touched files.

## Notes

No behaviour change expected, except that `<button>` gets native keyboard focus and Enter/Space, which is the point of 4.1. Check that each replaced span has no `onkeydown` handler that now fires twice, and reset button styles so nothing looks different. Safety: `check`, `lint`, tests, plus a visual pass over the touched screens. One commit per bullet. Rules: 1.1, 1.3, 1.5, 2.1, 4.1, 8.1, 10.1.
