# Report: standards audit of the frontend since 1.1.0
read: false

Date: 2026-11-21
Tree: `main` at `73d6c62`, compared with tag `1.1.0` (222 commits; 308 files under `src/` changed, about +11k/−2.6k lines).
Scope: all of `src/` against `docs/STANDARDS.md` (including Decisions) and `docs/policies/*.md`. The API standards were not applied.
Method: grep-based scans for the mechanical rules, reading files for the judgment rules, and before/after counts against the `1.1.0` tree. Every cited line was tagged with `git blame 1.1.0..HEAD`. `make check` was run as well. No code was changed.

Tags used below:
- **NEW**: written after 1.1.0.
- **TOUCHED**: existed at 1.1.0, but a later commit moved or rewrote it. Under `docs/policies/coding-standards.md` it must comply.
- **OLD**: unchanged since 1.1.0.

## Summary

- **New code has not made the codebase worse overall.** Most rules hold, several of the bad examples quoted in STANDARDS.md have been fixed, and new code is usually at least as good as the code next to it.
- **The one systematic weakness is copy-paste (§2, §1.6, §7).** New features copy from a similar file or store instead of extracting or extending shared code. There are five new duplication clusters, and the copied library filters have already drifted apart.
- **Reactivity is flat.** `$effect` count is 10 at both 1.1.0 and HEAD. `$derived` is 157 at both, on a codebase about 11k lines larger. No new effect was added.
- **The mechanical bans hold everywhere:** no direct `localStorage`, no stray `fetch`, no private key listeners.
- **Every new service ships with a unit test.**
- **`make check` is green:** eslint clean, `svelte-check` 0 errors / 0 warnings over 1452 files, 1685/1685 vitest tests pass. The `check` script silences `state_referenced_locally`, which is relevant to §3/§5, so 0 warnings says less about those rules.

## Verdicts per rule

| Rule | Verdict | Since 1.1.0 |
|---|---|---|
| §1.1 / 1.9 Attribute expressions, narrow once | Minor deviations | 175 multi-line `{…}` vs 174 at 1.1.0; a few new long conditions |
| §1.2–1.5 Conditionals, `class:`, `style`, `{@const}` | Adheres | 0 nested ternaries; the new `{@const}` is valid |
| §1.6 Repeated markup → snippet/component | **Significant deviations** | Several new cross-file copies |
| §1.7 / 1.8 Overlay once, no dead attributes | Adheres | Reference cases fixed |
| §2 Repetition | **Significant deviations** | 5 new clusters |
| §3 Reactivity in components | Minor deviations | 1 new `$derived` chain, 1–2 leaf auth reads |
| §4 Elements and handlers | Adheres for new code | `role="button"`: 18 → 18 |
| §5 `$effect` | Minor deviations | 0 new effects; 1 existing effect got a new state write |
| §6 Desktop/mobile variants | Mostly adheres | 1 new divergence |
| §7 Reuse shared components | **Minor to significant** | Hand-built icon buttons, a third search input |
| §8 i18n | Minor deviations | 0 new literals from feature code; ~9 TOUCHED |
| §9 KeyManager | Adheres | Extended the right way |
| §10 Comments | Minor deviations | ~80 new lines, ~10 "what" comments |
| §11 Stores | Minor deviations | New stores follow the pattern; Notes store growing |
| §12 Store methods | Adheres | 1 OLD false cast remains |
| §13 External formats / service tests | Adheres (tests 9/9) | 2 small inline parse/build cases |
| §14 `SvelteDate` | Adheres | Same 4 files, all correct |
| §15 Architecture | Minor deviations | 2 new direct API calls from a component |
| Policy: limited `$derived`/`$effect` | Adheres | Counts flat |

## 1. Bugs found along the way

1. **Invalid check-in date shows 1970** (`src/routes/check-in/date/[date]/+page.svelte:60`, NEW in `ba2815a6`). `formatDate(parsedDate!)` asserts non-null on a value that is `null` for a bad slug. It does not crash: `new Date(null)` gives the epoch, so `/check-in/date/xyz` shows "01.01.1970" as the heading. Minor.
2. **False cast** (`src/lib/state/Calendars.svelte.ts:174`, OLD). `getWidgetEvents()` returns `res.data as CalendarEvent[]`, which claims `Date` fields that the API sends as strings. `dashboard/YourDay.svelte:39-58` works around it with `new Date(e.start_date)`. This is the exact case §12.3 describes. It should go through `eventService.fromApi` like `loadEvents()`.

## 2. Repetition and copy-paste (§2, §1.6, §6, §7)

This is the main finding.

### 2.1 New duplication clusters (all NEW)

1. **Library filter state copied into 7 stores** (`0549b701`). `activeFilter` plus `reapplyFilter()`/`setFilteredEntries()` live in Book, Game, Link, Movie, Music, Plant and Recipe; the full filter switch is in four of them (e.g. `BookLibrary.svelte.ts:140-160`, `GameLibrary.svelte.ts:104-120`). The copies already differ: Book's `search()` resets `shelfIndex`, Game's doesn't. The switch belongs in `LibraryFilterService`.
2. **Tag/genre handlers rewritten in lockstep** (`c456722e`). 9 identical `onCreateTag`/`onCreateGenre` bodies (e.g. `BookCreate.svelte:111`), and `selectedGenres.filter((g) => g.value).map((g) => parseInt(g.value))` pasted 15 times (e.g. `BookCreate.svelte:135-136`, `GameCreate.svelte:126-127,168-169`). The budget-tags commit `5500c121` added one more handler (`BudgetTagPicker.svelte:20`) and three more copies of the tag→option mapping (`BudgetTagPicker.svelte:17`, `routes/finances/budget/+page.svelte:39,90`). That mapping already had 17 OLD copies.
3. **`ResendVerificationForm.svelte` copies the forgot-password page** (`61a44c1e`). Cooldown timer and "sent / resend" markup: `auth/ResendVerificationForm.svelte:20-27,47-61` vs `routes/auth/forgot-password/+page.svelte:22-29,45-63`. Line 77 also copies the hard-coded unit `({resendCooldown}s)`, which §8.1 names.
4. **`WorkspaceEdit.svelte` copies the rename flow of `CategoryEdit.svelte`** (`b383772e`). `todos/WorkspaceEdit.svelte:36-62` vs `CategoryEdit.svelte:42-67`, line for line. A comment on line 36 says so.
5. **Dev-request status filter written inline twice** (`38935af6`). `routes/dev-requests/[[id]]/+page.svelte:52` and `:90`, next to the new `DevRequestFilterService`, which exists for this (§15.8).

### 2.2 Repeated markup across files (§1.6)

- **Third hand-styled search input:** `notes/NoteSearch.svelte:90-107` (NEW file), after `libraries/shared/Search.svelte:60-75` and `contacts/Search.svelte:46-60` (OLD).
- **Mobile slide-in drawer shell in 5 files:** `TodoNavigationMobile:72`, `SettingsNavigationMobile:28`, `NoteNavigationMobile:133`, `TimeTrackingNavigation:322`, and NEW `libraries/links/CategoryNavigationMobile.svelte:52`. Commit `4ceb2584` edited the same class string in four of them at once, which is the signal that it should be one `ui/` component.
- **The same casted handler in two new files:** `libraries/shared/ListView.svelte:13` and `CardsView.svelte:31`: `onclick={() => (library as { openDetailModal(entry: LibraryEntry): void }).openDetailModal(entry as LibraryEntry)}`. This is also a §1.1 violation.
- **Within one file:**
  - `feeds/FeedNavigation.svelte:93-127`: three identical buttons; the third is NEW.
  - `dev-requests/DevRequestEntry.svelte`: mobile and desktop blocks duplicated (`:52-57`/`:87-92`, `:63-65`/`:78-80`, `:66-70`/`:95-99`).
  - `notes/NoteNavigationMobile.svelte:194-205, 242-253, 261-270`: the back/title/close header written three times.

### 2.3 Hand-built controls instead of shared components (§7.1, §7.3)

Icon-only action buttons with private styles, although `IconButton`, `InlineEditButton`, `InlineDeleteButton` and `EditButton` exist:

- `calendars/ExternalAccountEntry.svelte:14,44,48` (NEW file): a private `ACTION` class constant on two raw buttons.
- `calendars/CalendarEdit.svelte:102-109` (NEW): copies the share button next to it.
- `todos/WorkspaceEdit.svelte:132-139` (NEW): a raw pen button right next to a proper `DeleteButton`.
- `clipboard/ClipboardList.svelte:24,104,109` (NEW): an `ACTION_BUTTON` constant. The delete button at `:113-118` is OLD and raw, and §7.4 says delete is never raw.
- `clipboard/ClipboardCreate.svelte:39,225,228` (NEW): `PICKER_BUTTON`, a private copy of the TextButton look.

Likely cause: `IconButton` has no `title`/`aria-label` prop, and nobody extended it as §7.2 asks.

### 2.4 Desktop/mobile drift (§6)

- `notes/NoteNavigationMobile.svelte:87-102` (NEW) deletes a folder by setting the desktop context menu's state (`notes.rightClickType = 'category'; notes.rightClickId = …; notes.deleteCategory()`). The store should get a `deleteCategory(category)` instead.
- The desktop notes navigation switched to `ui/EmptyState` (`NoteNavigationDesktop.svelte:134`, NEW). The mobile variant still uses its raw empty-state div (`NoteNavigationMobile.svelte:189, 285`).

### 2.5 Good counter-examples

- Shared components were extended rather than forked: `InlineDeleteButton` got `class`, `ModalFormRow` got `labelFor`, `NavIndicator` got `edge`/`color`. New `ui/EmptyState` (8 users) and `ui/ProgressBar` live in the right place.
- New forms and modals use `TextInput`, `PasswordInput`, `Checkbox`, `TextButton`, `ContentModal`, `ConfirmationModal` and `ModalFormRow`, with no new raw Save/Cancel buttons.
- Calendar desktop/mobile now share their helpers (`getHoursOfDay`, `isOffHour`, `getMobileHourRows`, `getWeekdayOrder`).
- The examples STANDARDS.md cites (`color-mix`, hours array, off-hours, `visualViewport`, RRULE parser) are all fixed.

## 3. Markup expressions and handlers (§1, §4)

- **NEW, a regression:** `dashboard/Inspiration.svelte:81`. At 1.1.0 this condition was a named `isEmpty`; it is now a six-term `&&` inline in `{#if}`. Removing the `$derived` should have produced an `isEmpty()` function.
- **TOUCHED:** `ui/buttons/TextButton.svelte:45,47` and `ui/buttons/IconButton.svelte:42,44` each gained a fifth `type !== …` term instead of naming the condition.
- **NEW:** `feeds/FeedView.svelte:28`, a three-term condition over one store that a getter would cover (§1.9).
- **§4.1, rewritten but not fixed:**
  - `libraries/links/CategoryHeader.svelte:17-80`: four `<div role="button">` elements had their classes reworked and kept the role.
  - `dev-requests/DevRequestEntry.svelte:56,91` (NEW): click handlers on icons instead of buttons.
- **OLD debt that changed files left alone:** about 120 multi-line inline handlers, 18 `role="button"` elements, about 30 multi-line class/style ternaries.

## 4. Reactivity and stores (§3, §5, §11, §12, §14)

| Metric | 1.1.0 | HEAD |
|---|---|---|
| `$effect(` | 10 lines / 10 files | 10 / 10 (same files) |
| `$derived(` | 157 | 157 |
| `$derived.by` | 20 | 20 |
| `SvelteDate` | 4 files | 4 files (same) |
| Pure `let x = $derived(store.y)` aliases | 16 | 14 |

Deviations:
- **§5.1, NEW lines:** `libraries/shared/CoverImage.svelte:18-25`. The effect writes `$state` to reset image state; `fullLoaded = true` at :20 is new, joining older resets at :24-25. The new `$state(loadedCovers.has(src))` at :16 repeats the check.
- **§3.2, NEW:** `routes/check-in/date/[date]/+page.svelte:27-29`. A four-step `$derived` chain (`date` → `parsedDate` → `isToday`/`isYesterday`) picks one heading; `isToday`/`isYesterday` are each read once. It is now the only component with 5 `$derived`.
- **§3.3, NEW:** `notes/journal/JournalArchivePicker.svelte:4,9-10`, a leaf picker that reads `auth.getWeekStart()` instead of taking a prop.
- **§11.3 / §11.5, NEW:** `state/Notes.svelte.ts:226-231` `closeSearch()` resets four fields one by one. The new search feature (4 fields, 5 methods) is the self-contained part §11.5 says to split out; the store grew from 502 to 543 lines.
- **OLD:**
  - §5.5: `routes/notes/journal/[date]/+page.svelte:28-47` (`openedKey` shadow copy).
  - §5.6: `tour/WelcomeTour.svelte:23`.
  - §11.4: `Theme.svelte.ts:152`, `PwaInstall.svelte.ts:26` (listeners without `destroy()`; harmless at root-layout lifetime).

In good shape:
- No module-level `$state`.
- The new stores (`ExternalCalendars`, `FeedImport`, `LoadedCovers`) use the context pattern, and those with timers or listeners (`FeedImport`, `WidgetBridge`, `SessionMonitor`) have a wired-up `destroy()`.
- `Calendars.loadEvents()`, the reference bad case for §12.2, is now fetch → convert → assign.
- New `as` casts all sit at the API boundary on types without `Date` fields.
- No unused parameters in about 50 new method signatures.
- The feed entries turned six unneeded `$derived` into plain `let`.

## 5. i18n, KeyManager, comments, architecture (§8, §9, §10, §13, §15)

- **§8.1:** feature code added no literals (about 300 new `ts.get` reads). Refactors moved about 9 OLD literals without fixing them, which counts under the policy:
  - `settings/ExportSettings.svelte:79` `'Export failed.'`
  - `finances/AddBudget.svelte:77-78` `placeholder="Title"` / `"Value"`
  - `alt="Screenshot"` (`DevRequestEntry.svelte:111`), `alt="Cover"` (`EntryCover.svelte:33`), `alt="Clipboard"`, `alt="Deezer icon"`

  About 70 OLD literals remain, mostly in `routes/admin/+page.svelte` and `contacts/ContactEdit.svelte`.
- **§8.2:** informal address is consistent across `fr`/`es`/`it`.
- **§9:** no private key listeners. `k`, `ArrowUp` and `ArrowDown` were added to `KeyManager` properly. OLD leak: `todos/props/Description.svelte:57-63` does not unregister `EnterSubtask`/`EscapeSubtask`.
- **§10:** comment lines went from 233 to 314. Most new ones are legitimate *why* notes (Safari, iOS, proxy quirks). About 10 describe *what*:
  - `helpers/DateHelper.ts:436-452` (JSDoc restating names)
  - `services/CalendarEventService.ts:17`
  - `service-worker.ts:77`
  - `forms/MultiSelect.svelte:88`
  - `NoteNavigationMobile.svelte` `<!-- Level N -->` comments
- **§13:** all 9 new services are pure and tested. Small inline cases:
  - `state/WidgetBridge.ts:119-138`: a message `parse()` on the store.
  - `clipboard/ClipboardList.svelte:86-89`: a MIME → file-name helper in a component.
- **§15.1:** `dashboard/Inspiration.svelte:47,53` (NEW) calls `apiService.list(...)` directly from a component.
- **§15.3:** `state/Feeds.svelte.ts:83-87` (NEW) extends a query string built by hand in the store (`&feed_id=`).
- **§15.7:** new async code stops the loading indicator in `finally`. Six OLD early-return leaks remain (`Title.svelte:61`, `Subtask.svelte:67`, `NoteHeader.svelte:112`, `CategoryCreate.svelte:60`, `Friends.svelte:59`, `Description.svelte` submit).
- **§15.9:** domain types exported from services: `FeedImportService.ts:2-8` and `WealthStatisticsService.ts:4,9` (NEW).
- **Holds everywhere:** 0 direct `localStorage`, no new `fetch` beyond the two accepted exceptions, one `ApiService` instance.

## 6. Documentation drift

- `AGENTS.md` still says four locales and that `npm run lint` runs Prettier. The repo has 6 locales (`it`, `ru` added) and no Prettier.
- STANDARDS.md §8.1 lists 5 locales and omits `ru`.

## 7. Suggested order of work

1. Extract the library filter into `LibraryFilterService` and the tag/genre handlers into a helper. These copies are already drifting.
2. Add `title`/`aria-label` to `IconButton` and replace the five hand-built icon buttons.
3. Turn the search input and the mobile drawer shell into `ui/`/`forms/` components.
4. Small fixes: `Inspiration.svelte:81` back to a named condition, `Calendars.getWidgetEvents()` through `fromApi`, the check-in invalid-date heading, the ~9 TOUCHED literals.
5. Update `AGENTS.md` and STANDARDS §8.1.

## 8. Follow-up (2026-11-21, same day)

Worked through with the owner after the audit.

**Fixed:**
- `todos/WorkspaceEdit.svelte`: the hand-built rename button is now `EditButton` (minimal).
- Labels: the five clipboard buttons (copy, download, delete, attach image, attach file) had no `title` or `aria-label`; the calendar share button had no `aria-label`. New keys `clipboard.download`, `delete_entry`, `attach_image`, `attach_file` in all six locales.
- New `ui/buttons/GhostIconButton.svelte` (required `label`, `color` as a value) for the four round icon buttons in `ExternalAccountEntry.svelte` and `CalendarEdit.svelte`.
- §6: `AGENTS.md` (six locales, no Prettier) and STANDARDS §8.1 (`ru`).

**Corrections to this report:**
- §2.1 item 1 overstated the library filter. Only Book, Game, Movie and Music share the filter switch; Plant, Recipe, Link and Quote have their own filters. The "drift" is not drift: only Book and Music have a shelf view, so only they reset a shelf position, and only books can be lent. 45 tests in `tests/unit/stores/LibraryStores.test.ts` cover it. Left as is (owner decision).
- §2.3: the likely cause is not a missing `IconButton` prop. `IconButton` is a filled, padded button; the hand-built ones are round ghost icons, a look no shared component had. Hence `GhostIconButton`.

**Not done, recorded in the backlog:** `docs/backlog/standards-audit-followups.md` (remaining deviations) and `docs/backlog/bug-review-since-1.1.0.md` (a correctness review this audit did not do).
