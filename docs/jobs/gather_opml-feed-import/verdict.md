# Verdict: import feeds from an OPML file (app)

id: gather
status: open
reviewer: @reviewer
date: 2026-11-14

<!-- Produced by @reviewer after implementation. -->

## Review

Verified: brief says `branch: main` (owner decision, uncommitted work on `main`, one
commit at the end by the owner's session), and the working tree is on `main`. The review
surface was the working tree (`git status --short`, `git diff`, plus the untracked files),
not `main...HEAD`. Nothing was staged or committed by this review except this file, which
is also left uncommitted, as instructed.

Changed files match `implementation.md` and the translator's TASK-13. The one
untracked file the notes don't mention is `docs/backlog/opml-feed-import.md`. That is the
brief's source entry, so it doesn't need explaining.

Checks run by the reviewer: `npm run check` gives 0 errors and 0 warnings (all six locales
are in sync). `npm run lint` exits 0. `npm test` passes: 87 files, 1367 tests (re-run after the
blocker fix; it was 1366 before the new test).

Api contract checked against `/workspace/api/app/Api/Feeds/` and `api/routes/api.php:393-397`:
- Routes `/feeds/import`, `/feeds/import/select`, `/feeds/import/state` match.
- `FeedImportStateResource` fields (`stage`, `total`, `processed`, `feeds[].url/title/already_subscribed/status`) match `types/feed.ts` exactly, including the nullable `status` enum.
- The upload multipart field is `file`.
- Both POSTs go through `postWithStatus`. The `ApiResponse::success` envelope is read as `res.data.data` (POST) and `res.data` (GET), which is right.
- `select` returns its in-memory `running` DTO (`OpmlImportService.php:111-119`). So after Import, the store's previous stage is `running`, and the first `finished` poll triggers `feeds.load()` as intended.

Flagged items, my judgement:
- (a) A 429 on `select` only shows the toast. **Not a blocker.** Only the upload route has a throttle (`throttle:feeds-import`, `api.php:394`). `select` has no rate limiter, and there is no global api throttle. So the api cannot send a 429 on `select`, and the root toast is a sane fallback for a proxy-level one.
- (b) If the first `refresh()` on open throws a network error, the body stays empty. **Not a blocker.** The brief only defines `parsed`, `running`, `finished` and 404 for this step. The root network toast still fires. The loading indicator stops (`try/finally`). `ContentModal` always shows a close button when `onClose` is set (`BottomSheetModal.svelte:104-106`, popup likewise), and reopening retries.

TASK-1: PASS
notes: `src/lib/types/feed.ts`. The types mirror `FeedImportStateResource`, including the `already_subscribed` boolean that the brief left out.

TASK-2: PASS
notes: `src/lib/config/apiRoutes.ts:259-261`, inside the `feeds` block.

TASK-3: PASS
notes: `src/lib/services/FeedImportService.ts`.
- `initialSelection` reads `already_subscribed`, not `status`, as it must for `parsed` (where every `status` is `null`).
- `group` keys on `status` only. It skips `pending`/`null` and keeps url, title and reason for failed feeds.
- `progress` returns 0 when `total` is 0.
- `allSelected`/`toggleAll` (Answer 5) and `toggle` keep the push/filter out of the component.
- Tests in `tests/unit/services/FeedImportService.test.ts` cover every case the brief lists.

TASK-4: PASS
notes: `src/lib/components/ui/ProgressBar.svelte`. One `value` prop (0..1), using the Calendar/Contacts bar classes.

TASK-5: PASS
notes: `src/lib/components/forms/Checkbox.svelte`. Optional `disabled`, default `false`. With the default, `cursor-pointer` and `hover:shadow-md` are still applied (now via `class:`), so existing consumers render the same. The `class:` directives come before any ternary, and attributes are on one line.

TASK-6: PASS
notes: `src/lib/components/forms/FileUpload.svelte`. Optional `accept` and `onfile`, with no `file` bindable (Answer 3). When neither is passed, `accept` is omitted and `onfile?.()` does nothing, so `DevRequestEdit` and `InsertImageModal` behave as before.

TASK-7: PASS
notes: `src/lib/state/FeedImport.svelte.ts`.
- Follows the rule 15.2 shape and member order. `feeds` is injected with a default.
- `upload` catches only `RateLimitedError` and turns it into 429. Anything else is rethrown.
- `refresh` keeps the previous state when `get` returns null (rule 15.4). It compares stages after the await and calls `load()` only on `running` → `finished`.
- `setFeedImport()` sits right after `setFeeds()` in `src/routes/feeds/+layout.svelte`.

TASK-8: PASS
notes: `tests/unit/stores/FeedImport.test.ts` covers FormData/`file`/`importStart`, `select` posting `{ urls }`, `load()` once on running→finished, no `load()` when the state is finished from the start, and 422/409/429 reaching the caller. The `tests/unit/setup/storeMocks.ts` change is additive: it re-exports the real error classes via `importOriginal` (Answer 1), `FakeApi` is unchanged, and every existing store test still passes.

TASK-9: PASS
notes: `src/lib/i18n/en.ts` and `src/lib/types/translation.ts` get 20 `feeds.import_*` keys. Close and generic error are in `feeds` (Answer 2). There is one 422 message (Answer 4). `_singular`/`_plural` is used for "n selected", and `{n}` placeholders match the existing pairs.

TASK-10: PASS
notes: `src/lib/components/feeds/FeedImportModal.svelte`.

What is right:
- The four views and routing on open.
- Per-status upload errors are shown in the modal. A `select` failure shows the generic error, resets, and goes back to the picker.
- `try/finally` around the loading indicator on all three paths: open, upload, Import.
- No `$effect`. Every visible string goes through `ts.get`.
- The scrolling list is capped (`max-h-[50vh]`). Rows show the title plus a muted, truncated URL. Already-subscribed rows are disabled, unticked and labelled.
- Import is disabled at 0.
- The single `{@const}` is a bare member narrowed by `{#if}` and read twice (rule 1.5).
- Polling stops on `finished` and at the 2-minute cutoff (generic error plus Close), and is cleared in `onDestroy`. Requests don't overlap.

Previous blocker, resolved: polling could start after the modal was destroyed, because
`startPolling()` runs after an `await` in both `open()` (via `showStage`) and
`startImport()`. Now `onDestroy(destroy)` sets `destroyed = true` and calls
`stopPolling()`. `startPolling()` and `scheduleNextPoll()` both return early once
`destroyed` is set.
- Both late paths are covered, because `open()` and `startImport()` both go through `startPolling()`.
- A poll already in flight at unmount is also covered. `continuePolling()` returns on `!polling`, and `scheduleNextPoll()` is guarded too.
- The timer is never re-armed after destroy, so rules 5.2/5.4 hold.

TASK-11: PASS
notes: `src/routes/feeds/+page.svelte` mounts the modal under `{#if feedImport.modalOpen}`, next to `FeedBrowserModal`. `src/lib/components/feeds/FeedNavigation.svelte` adds a third entry with the same markup and classes as its neighbours, `IconFileUp` at `size={16}`, and it calls `handleNavigation()`.

TASK-12: PASS
notes: `tests/components/feed-import-modal.test.ts` plus the test-local `helpers/FeedImportModalContext.svelte`. The shared harness is unchanged. There are two tests.

The first unmounts during an active poll.

The second covers the TASK-10 race. It unmounts while the open-time `refresh()` is still pending (the mock sets the stage to `running` and returns an unresolved promise), then resolves it, advances 10 s of fake timers, and asserts there was exactly 1 call. I checked by reading the code that it really covers the race:
- Without the guard, the resolved promise reaches `showStage('running')` → `startPolling()`, and a 1 s timer fires a second `refresh()`. So the test would count 2 calls and fail, as the developer reports.
- With the guard there is no timer.
- I did not re-run it against the unfixed code; that needs a source edit.

The `select()` path isn't tested separately. It goes through the same guarded `startPolling()`, so that's enough.

TASK-13: PASS
notes: `de/es/fr/it/ru` each get all 20 keys, with `{n}`/`{total}` placeholders intact. Glossary is followed ("Feeds"/"feed" in `de`/`es`/`it`, "flux" in `fr`, "ленты" in `ru`), and OPML is left untranslated. The `fr` escaped apostrophes and `ru`'s two-keys-per-line layout match how those files were already written. `docs/I18N.md:56` adds "OPML" to the brands line.

## Security

None. The upload is sent as multipart to the existing authenticated api, which validates it server-side. Feed titles and URLs are rendered as text interpolation, not `{@html}`. No new dependencies.

## Overall

APPROVED

What must change before this can be merged:
- Nothing. The one blocker from the first pass (polling could start after `onDestroy`) is fixed with the `destroyed` guard in `FeedImportModal.svelte`, and a regression test covers it. `implementation.md` records the fix. Flagged items (a) and (b) are judged non-blocking above. The end-to-end click-through against a local api remains with the owner (Job notes).
