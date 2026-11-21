# Backlog: smaller standards deviations from the 1.1.0 audit

created: 2026-11-21

## What

Deviations from the audit (`docs/reports/2026-11-21-standards-audit-since-1.1.0.md`)
that the owner chose not to fix now. Fix them when touching the code; none is
urgent. Line numbers as of 2026-11-21.

1. **Copy-paste clusters (§2, §1.6).**
   - Tag/genre handlers: 9 identical `onCreateTag`/`onCreateGenre` bodies, and
     `selectedGenres.filter((g) => g.value).map((g) => parseInt(g.value))`
     pasted about 15 times (e.g. `BookCreate.svelte:135-136`); the tag→option
     mapping has about 20 copies (`BudgetTagPicker.svelte:17`,
     `routes/finances/budget/+page.svelte:39,90`).
   - A third hand-styled search input (`notes/NoteSearch.svelte:90`) next to
     `libraries/shared/Search.svelte` and `contacts/Search.svelte`.
   - The mobile slide-in drawer frame in 5 files (e.g.
     `libraries/links/CategoryNavigationMobile.svelte:52`).
   - `ResendVerificationForm.svelte` copies the forgot-password countdown;
     `WorkspaceEdit.svelte:36-62` copies `CategoryEdit.svelte`'s rename flow.
   - The library filter in Book/Game/Movie/Music was looked at and left as is
     (owner decision 2026-11-21): short, its differences are legitimate, and
     45 tests cover it.
2. **Small fixes.**
   - `dashboard/Inspiration.svelte:81`: a six-term inline condition that used
     to be a named `isEmpty`.
   - `state/Calendars.svelte.ts:174`: `res.data as CalendarEvent[]` claims
     `Date` fields the API sends as strings; go through `eventService.fromApi`.
   - `routes/check-in/date/[date]/+page.svelte:60`: an invalid date in the URL
     renders a 01.01.1970 heading.
   - About 9 untranslated strings that refactors moved without fixing (e.g.
     `ExportSettings.svelte:79`, `AddBudget.svelte:77-78`, several `alt` texts).
   - `notes/NoteNavigationMobile.svelte:87-102` deletes a folder by setting
     the desktop context menu's state; the store needs a
     `deleteCategory(category)`.
   - `clipboard/ClipboardCreate.svelte`: the picker buttons keep a private
     `PICKER_BUTTON` style (close to `IconButton`, which would need a `label`
     prop).
   - Clipboard delete is a raw red button; §7.4 says delete uses the shared
     delete button. Its look differs, so the owner skipped it (2026-11-21).
3. **Older debt in touched files:** 18 `role="button"` elements, about 120
   multi-line inline handlers, six loading-indicator leaks on early returns
   (`Title.svelte:61`, `Subtask.svelte:67`, `NoteHeader.svelte:112`, …), and
   the `Notes` store's search part, which §11.5 says to split out.
