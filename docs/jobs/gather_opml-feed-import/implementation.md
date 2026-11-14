## Summary

Frontend half of the OPML feed import, TASK-1 to TASK-12. "Import OPML" in the feeds sidebar opens a modal with four views: pick a file, preview with checkboxes, progress, and result. Pure logic is in `FeedImportService`. Api calls go through a new `FeedImport` store. The modal owns polling and stops it on `finished`, after the 2-minute cutoff, and in `onDestroy`. There is no `$effect`. Only `en` strings are written. TASK-13 (the other locales and the `docs/I18N.md` "OPML" line) is left for the translator agent. Nothing is committed (owner's instruction).

Checks: `npm run lint` passes. `npm test` passes (87 files, 1366 tests). `npm run check` reports 5 errors, 0 warnings. All 5 are the expected missing `feeds.import_*` keys in `de`, `es`, `fr`, `it` and `ru`.

## Changes

TASK-1: `src/lib/types/feed.ts` gets `FeedImportStage`, `FeedImportStatus`, `FeedImportEntry` (including `already_subscribed: boolean`, which the brief left out) and `FeedImportState`. They mirror `FeedImportStateResource`.

TASK-2: `src/lib/config/apiRoutes.ts` gets `importStart`, `importSelect` and `importState` in the `feeds` block.

TASK-3: new `src/lib/services/FeedImportService.ts` (a class with a default export, like `TodoGroupingService`):
- `initialSelection`: every URL whose `already_subscribed` is false.
- `allSelected` / `toggleAll`: the select-all/none logic (Answer 5). These ended up as two functions, because the toggle's label and its action both need the "all selected" check.
- `toggle(selected, url)`: one row. This keeps the push/filter out of the component, as the brief asks.
- `group`: added / already subscribed / failed. Failed entries become `{ url, title, reason }`, and `pending`/`null` entries are left out.
- `progress`: 0 when `total` is 0.

Tests are in `tests/unit/services/FeedImportService.test.ts`.

TASK-4: new `src/lib/components/ui/ProgressBar.svelte`. It has one `value` prop (0..1) and takes its classes from the Calendar/Contacts inline bars. I left out their `mt-2` margin, so the caller handles spacing.

TASK-5: `src/lib/components/forms/Checkbox.svelte` gets an optional `disabled` prop (default `false`). When set, it uses `cursor-not-allowed` and `opacity-40` and drops the hover shadow. Existing consumers don't change.

TASK-6: `src/lib/components/forms/FileUpload.svelte` gets two optional props: `accept`, passed to the `<input>`, and `onfile(file: File)`, called as soon as a file is picked. There is no `file` bindable, because the modal doesn't read one (Answer 3). The two existing consumers don't change.

TASK-7: new `src/lib/state/FeedImport.svelte.ts` (rule 15.2 shape; `auth`, `apiService`, `feeds` are injected with defaults). Methods:
- `upload(file)`: sends multipart field `file` via `postWithStatus` and returns `{ ok, status }`. A thrown `RateLimitedError` becomes `{ ok: false, status: 429 }`; any other error is rethrown.
- `select(urls)`: posts `{ urls }` via `postWithStatus` and returns `{ ok, status }`.
- `refresh()`: returns `false` when `get` returns null (404 or another failure) and keeps the previous state then (rule 15.4). This way a transient failure while polling doesn't lose the running→finished transition. It reads the previous stage after the await and calls `feeds.load()` only on `running` → `finished`.
- `reset()`: one assignment.

`setFeedImport()` is called in `src/routes/feeds/+layout.svelte` right after `setFeeds()`.

TASK-8: new `tests/unit/stores/FeedImport.test.ts` (uses injected mocks). `tests/unit/setup/storeMocks.ts` now re-exports the real `NetworkError`/`RateLimitedError` via `importOriginal` (Answer 1). The `FakeApi` class itself is unchanged; every existing store test still passes.

TASK-9: 20 new `feeds.import_*` keys in `src/lib/i18n/en.ts` and `src/lib/types/translation.ts`. All new keys are in `feeds`, including `import_close` and `import_error_generic` (Answer 2). There is one 422 message, `import_error_unreadable` (Answer 4). Placeholders use `{n}` (and `{total}` in the progress line), matching the existing `{n}` pairs. Only "n selected" is a `_singular`/`_plural` pair. The result headings put the count in parentheses ("Added ({n})"), so they need no plural form. The progress line uses `...` like the other `en` strings, not `…`.

TASK-10: new `src/lib/components/feeds/FeedImportModal.svelte`, built on `ContentModal` (`width="2xl"`). The view is a local `$state` (`picker | preview | progress | result | failed`) and is set in handlers, never derived from the store.
- On open, it calls `refresh()` once: `running` goes to the progress view and starts polling, `finished` goes to the result view, and `parsed` or not found goes to the picker.
- Polling is a recursive `setTimeout` (1 s) that only starts after the previous `refresh()` has settled, so requests don't overlap. It stops on `finished`, after 2 minutes (generic error + Close), and in `onDestroy`.
- An in-flight request after unmount doesn't schedule another poll (`polling` flag). A thrown error in a poll still schedules the next one (`finally`) and reaches the root layout's network-error toast.
- Upload errors map by status: 422, 409 and 429 each have their own message, anything else gets the generic one. A failed `select` shows the generic error, resets, and returns to the picker.
- The loading indicator is wrapped in `try/finally` on every path.
- The preview list is capped at `max-h-[50vh]` and scrolls; the failed list is capped at `max-h-[40vh]`.
- In the result view, "Added" is always shown. "Already subscribed" and "Didn't work" are only shown when their count is above 0. Failed rows show the title, the muted URL and the reason.
- The result headings use one `{#snippet}`. `{@const}` is used once, under `{#if}`, on a narrowed member (rule 1.5).

TASK-11: `src/routes/feeds/+page.svelte` mounts `FeedImportModal` under `{#if feedImport.modalOpen}`. `src/lib/components/feeds/FeedNavigation.svelte` gets a third entry below "Browse feeds": same markup, `IconFileUp` at `size={16}`, and it sets `feedImport.modalOpen = true` and calls `handleNavigation()`.

TASK-12: done without changing the shared harness. A new test-local wrapper, `tests/components/helpers/FeedImportModalContext.svelte`, calls `setFeeds()`/`setFeedImport()` and renders the modal through the unchanged `renderWithContext`. `tests/components/feed-import-modal.test.ts` stubs `FeedImport.prototype.refresh` to return `running`, uses fake timers, unmounts, and asserts that no further `refresh` calls happen. As a check, I temporarily removed `onDestroy(stopPolling)`: the test then failed with 12 calls instead of 2. The file is restored.

TASK-13: not done (owner's instruction). It goes to the translator agent.

Review fix (verdict blocker): polling could start after unmount. If the modal closed while the open-time `refresh()` or `select()` was still pending, `onDestroy` had already run, and the resolved request then started a timer nobody cleared. Now `onDestroy` sets a `destroyed` flag (`destroy()`), and `startPolling()` and `scheduleNextPoll()` return early when it is set. The new test in `tests/components/feed-import-modal.test.ts` unmounts while the first `refresh()` (returning `running`) is pending, resolves it, advances the timers, and asserts no further calls. It failed before the fix (2 calls instead of 1) and passes now.

## Known issues / follow-ups

- **TASK-13 is pending.** `de`, `es`, `fr`, `it` and `ru` need the 20 `feeds.import_*` keys, and "OPML" needs adding to the "Brands and product names" line in `docs/I18N.md`. `npm run check` fails until then.
- **Finding, not fixed:** `ApiService.post` sends `FormData` through `JSON.stringify`, because its `typeof body === 'object'` check is true for `FormData`. `postRaw` has the same check. This job uses `postWithStatus`.
- **Finding:** `fetchWithRecovery` throws `RateLimitedError` for every 429, so `postWithStatus` can never report 429. The store catches it for upload. `select` does not; a 429 there would go to the root toast.
- **Follow-up:** `ui/ProgressBar` should replace the inline bars in `calendars/ImportModal.svelte` and `contacts/ImportModal.svelte`, and probably the differently styled one in `forms/FileUpload.svelte` (`h-2.5 bg-blue-600`).
- `FileUpload` still shows its own base64 "Processing" bar and green "selected file" box before the modal moves to the preview (accepted in Answer 3). Its input id is still hardcoded to `file-upload`. If the same file is picked twice in a row (for example, retrying after an error), the browser fires no `change` event, so nothing happens.
- If the first `refresh()` on open throws a network error, the modal body stays empty. The root toast still shows and the modal can be closed.
- `ProgressBar` has no `role="progressbar"`/aria values. I kept it identical to the bars it copies; adding them is a small a11y follow-up.
- **Not verified by rendering:** the feeds route needs a logged-in session against the api, which this sandbox doesn't have, so no `shot` was run. The end-to-end click-through against a local api with a real export (Miniflux/FreshRSS/Feedly) is left to the owner.
- **Desktop/mobile shells:** per the analyst's check, `/workspace/desktop/frontend/` is a vendored copy and `/workspace/mobile` syncs `../app` at build time. They get the feature on their next sync/build. No change was made there.
