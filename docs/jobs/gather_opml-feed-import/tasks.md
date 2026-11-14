# Tasks: import feeds from an OPML file (app)

id: gather
status: open
analyst: @analyst
date: 2026-11-13

<!-- Produced by @analyst from brief.md. -->

## Scope note

Branch: brief.md says `branch: main` as an owner decision (work on `main`, no
per-task commits, one commit at the end by the owner's session). Being on
`main` is correct for this job.

Frontend half of the OPML import. The api is done (`/workspace/api/app/Api/Feeds/`,
routes `api/routes/api.php:393-397`). Out of scope as the brief says: folders,
export, per-feed titles, retrying, the Calendar/Contacts import modals, fixing
`ApiService.post`, switching the two existing modals to the new progress bar,
the desktop/mobile shells.

## Starting points found during analysis

Checked against the code. Where the brief and the code differ, the code is
listed first.

**Api contract (checked against `FeedImportStateResource.php`, `OpmlImportService.php`, `FeedImportController.php`)**

- State shape: `{ stage, total, processed, feeds: [{ url, title, already_subscribed, status }] }`.
  **Each entry has an `already_subscribed: boolean` field that the brief's type
  list leaves out.** `FeedImportEntry` needs it.
- In `parsed`, **every `status` is `null`** (`OpmlImportService.php:71-76`).
  "Already subscribed" in the preview is only the boolean. So the initial
  selection (and the greyed-out rows) must read `already_subscribed === true`,
  not `status === 'already_subscribed'`. `status === 'already_subscribed'` only
  shows up after the run, for feeds subscribed between preview and import.
- After `select`, the state's `feeds` contains **only the selected, importable
  entries** (`:99-111`), so `total` = the number selected, every entry starts
  at `pending`, and the result grouping uses `status` only.
- `processed` = entries whose status is neither `null` nor `pending`.
- Upload: multipart field `file`, `required|file|max:1024|extensions:opml,xml`
  (`ImportFeedsRequest.php`). Select: `{ urls: string[] }`, 1..500.
- Statuses match the brief's Job notes: upload 422/409/429, select 404/409/422,
  state 404.

**`ApiService` (`src/lib/services/ApiService.ts`)**

- `post` (`:263-271`) stringifies `FormData`, as the brief says. `postWithStatus`
  (`:273-290`) handles `FormData` and returns `{ ok, status, data }`. On non-2xx,
  `data` is `null`.
- **429 is never returned as a status.** `fetchWithRecovery` (`:146-148`)
  *throws* `RateLimitedError` for every 429, and the root layout turns uncaught
  ones into a toast (`helpers/NetworkErrorHelper.ts:9-33`). So
  `postWithStatus` will never report `status: 429`. To show the in-modal
  "too many imports" message, `FeedImport.upload()` has to catch
  `RateLimitedError` and turn it into `{ ok: false, status: 429 }`, and rethrow
  anything else. There's precedent for catching it locally:
  `components/settings/ExportSettings.svelte:80-82`,
  `routes/auth/verify/[user_id]/[token]/+page.svelte:39-41`.
- `get` returns `null` on 404 (and on any non-2xx), so `refresh()` can't tell a
  404 from another failure. The brief treats both the same way (file picker).

**Store pattern**

- `state/CalendarImport.svelte.ts` matches the brief: constructor injection with
  defaults, `Symbol` key, `set`/`get` pair. Member order and rules: STANDARDS 15.2.
- `routes/feeds/+layout.svelte:9` is where `setFeeds()` runs. `setFeedImport()`
  goes right after it. `getFeeds()` is available there to inject.
- `state/Feeds.svelte.ts:63` `load()` exists, as the brief assumes. Its
  `modalOpen`/`browseOpen` flags are the precedent for `FeedImport.modalOpen`.

**Components to reuse**

- `components/feeds/FeedNavigation.svelte`: "Add feed" / "Browse feeds" buttons
  are at `:89-108` (the brief says `:89-110`; the closing `</div>` is `:109`).
  Icons come from `@lucide/svelte/icons/*`, `size={16}`, same class string.
- `routes/feeds/+page.svelte`: `FeedBrowserModal` is mounted at `:15-17` (the
  brief says `:16-18`).
- `components/ui/ContentModal.svelte`: a thin switch between
  `PopupContentModal` and `BottomSheetModal` (mobile). It passes every prop
  through, so the modal is `title` / `rounded` / `onClose`, like the calendar one.
- **`components/forms/Checkbox.svelte` has no `disabled` prop** (only
  `isChecked`, `onchange`, `class`). The brief needs "can't be ticked" rows, so
  `Checkbox` gets an optional `disabled` (rule 7.2, extend, don't fork).
- **`components/forms/FileUpload.svelte` doesn't tell the parent when a file is
  picked.** It exposes `value` (base64), `filename` and `input` as bindables,
  but there's no callback. Reading `input.files[0]` from the parent would
  mean watching a bindable, which is the `$effect` the brief rules out. So
  besides the `file` bindable the brief suggests, the modal needs an optional
  `onchange`-style callback that gets the `File`. It also has no `accept`
  prop, so `.opml,.xml` filtering in the picker needs another optional prop.
  Two consumers today (`dev-requests/DevRequestEdit.svelte`,
  `notes/editor/InsertImageModal.svelte`). Optional props with defaults leave
  them unchanged. Side note: `FileUpload` still does its base64 read and shows
  its own "Processing" bar and a green "selected file" box. That's harmless
  here, but it will look like a second progress step. Also, its input id is
  hardcoded to `file-upload`.
- `components/ui/buttons/TextButton.svelte`: `title`, `onclick`, `type`,
  `disabled`, `class`. Enough for Import / Close / select-all / Import another.
- No `ui/*Progress*` component exists. Inline bars:
  `calendars/ImportModal.svelte:177-186` (outer `mt-2 h-4 w-full rounded-lg
  border-1 border-c-primary shadow-sm`, inner `h-full rounded-lg bg-c-primary
  transition-all duration-1000`), and `contacts/ImportModal.svelte:~176-184`, which
  has the same classes. The brief says `:173-185`. `FileUpload.svelte:118-125`
  has a third inline bar in a different style (`h-2.5 bg-blue-600`). Not in
  scope, but worth naming in the ProgressBar follow-up note.
- Calendar polling is `calendars/ImportModal.svelte:80-103` (the brief says
  `:78-104`). It's a recursive `setTimeout` with no cleanup, as the brief says.

**Routes / types**

- `config/apiRoutes.ts` `feeds` block is `:249-259`. The three new entries go
  inside it.
- `types/feed.ts` has no import types yet.

**i18n**

- Locale files: `en, de, es, fr, it, ru` (six). `AGENTS.md` still says four.
- `feeds` section: `src/lib/i18n/en.ts:851-887`, `FeedRecords` in
  `src/lib/types/translation.ts:831`. `layout`: `en.ts:32-56`,
  `LayoutRecords` at `translation.ts:3`.
- **No "close" key exists** (Job notes confirm this). **No generic error key
  exists either.** The brief keeps saying "the generic error", but `en.ts` has
  no such string (the closest are the feature-specific `calendar.import_error`
  / `contacts.import_error`). So a new key is needed, e.g. `feeds.import_error`.
- Plurals: existing pairs use `{n}` (`layout.rate_limited_minutes_singular/_plural`),
  and the key is picked by count in a helper (`NetworkErrorHelper.ts:41`). The
  brief's proposed strings use `%d`. Either works under I18N.md, but `{n}` matches
  the existing pairs.
- `docs/I18N.md:55-56` is the "Brands and product names" line where "OPML" goes.

**Tests**

- **Service tests live in `tests/unit/services/`**, not straight in `tests/unit/`
  (e.g. `TodoGroupingService.test.ts`). Store tests: `tests/unit/stores/`,
  reference `tests/unit/stores/Feeds.test.ts`.
- **The stores project mocks `$lib/services/ApiService` with only a `default`
  export** (`tests/unit/setup/storeMocks.ts:70-86`). If `FeedImport` imports
  `RateLimitedError` from there, it is `undefined` in store tests and
  `instanceof` throws. The 429 test needs either the shared mock to re-export
  the real error classes (`importOriginal`) or a per-file `vi.mock` override.
  See open questions.
- `tests/components/helpers/ContextHarness.svelte` doesn't seed `Feeds` or
  `FeedImport`, so an optional component test needs overrides.

**Desktop / mobile shells (check only)**

- Neither wraps this app live. `/workspace/desktop/frontend/` is a vendored
  copy of the frontend (with its own i18n files). `/workspace/mobile` syncs
  `../app` at build time (`dev/build-apk.sh:10`, `scripts/build.sh`). They get
  the feature after their next sync/build, not "for free". No change in this job.

## Task breakdown

TASK-1: Add `FeedImportStage`, `FeedImportStatus`, `FeedImportEntry` (`url`,
`title`, `already_subscribed: boolean`, `status: FeedImportStatus | null`) and
`FeedImportState` (`stage`, `total`, `processed`, `feeds`) to `types/feed.ts`,
mirroring `FeedImportStateResource` exactly.
files: src/lib/types/feed.ts
depends: none
risk: low. Type-only. The one catch is `already_subscribed`, which the brief's list misses.

TASK-2: Add `importStart` (`/feeds/import`), `importSelect` (`/feeds/import/select`)
and `importState` (`/feeds/import/state`) to the `feeds` block of `apiRoutes`.
files: src/lib/config/apiRoutes.ts
depends: none
risk: low. Three string entries in an existing block.

TASK-3: Create `services/FeedImportService.ts` with pure functions: initial
selection (every URL whose `already_subscribed` is false), grouping a finished
state into added (`subscribed`) / already subscribed (`already_subscribed`) /
failed (`unreachable`, `not_a_feed`, each keeping its reason and URL), and the
progress fraction `processed / total` that returns 0 for `total = 0`. Add its
unit tests.
files: src/lib/services/FeedImportService.ts (new), tests/unit/services/FeedImportService.test.ts (new)
depends: TASK-1
risk: low. Pure logic, node tests. Read `already_subscribed` (boolean) for the
selection and `status` for the grouping, as noted above.

TASK-4: Create `ui/ProgressBar.svelte` with one `value` prop (`0..1`, rule 3.4),
using the classes of the Calendar/Contacts inline bars (outer border box,
inner `bg-c-primary` fill with the width transition).
files: src/lib/components/ui/ProgressBar.svelte (new)
depends: none
risk: low. New leaf component, no consumers changed. The two existing modals
stay as they are (follow-up note only).

TASK-5: Extend `forms/Checkbox.svelte` with an optional `disabled` prop
(default `false`) passed to the `<input>`, with a muted, not-allowed look when set.
files: src/lib/components/forms/Checkbox.svelte
depends: none
risk: low. Additive optional prop. Many existing consumers, but none pass it,
so their behaviour doesn't change. `tests/components/forms*.test.ts` must stay green.

TASK-6: Extend `forms/FileUpload.svelte` with three optional props: a `file`
bindable (the raw `File`), a callback fired with the `File` when one is picked,
and an `accept` string passed to the `<input>`. Defaults leave the two existing
consumers unchanged.
files: src/lib/components/forms/FileUpload.svelte
depends: none
risk: medium. Shared form component with two consumers (`DevRequestEdit`,
`InsertImageModal`). The callback is needed because the parent can't react to
a bindable without `$effect` (see Starting points). Confirm the exact shape
(open question 3).

TASK-7: Create `state/FeedImport.svelte.ts` (rule 15.2 shape: `$state`
`modalOpen` and `state: FeedImportState | null`. Collaborators `auth`,
`apiService`, `feeds: Feeds` injected with defaults. `Symbol` key,
`setFeedImport()`/`getFeedImport()`). Methods:
`upload(file)` sends `FormData` with field `file` via `postWithStatus` to
`importStart`, sets `state` on success, returns the status, and turns a thrown
`RateLimitedError` into status 429 (rethrows everything else).
`select(urls)` posts `{ urls }` via `postWithStatus` to `importSelect`, sets
`state` on success, returns the status.
`refresh()` gets `importState` (`null` on 404) and calls `feeds.load()` only
when the previous `state.stage` was `running` and the new one is `finished`.
Plus a `reset()` that clears `state` (rule 11.3). Then call `setFeedImport()`
in `routes/feeds/+layout.svelte` right after `setFeeds()`.
files: src/lib/state/FeedImport.svelte.ts (new), src/routes/feeds/+layout.svelte
depends: TASK-1, TASK-2
risk: medium. The 429-as-exception path is not in the brief, and the
running→finished check must compare against the store's own previous state, not
a watcher (rule 5.6). The store holds no timer (the modal owns polling), so
rule 11.4's `destroy()` does not apply.

TASK-8: Add store tests for `FeedImport` with injected mocks: `upload` sends
`FormData` (field `file`) through `postWithStatus` to `importStart`. `select`
posts `{ urls }` to `importSelect`. A `refresh` going `running` → `finished`
calls `feeds.load()` once, and a `refresh` that finds `finished` from the start
doesn't. Status codes (422, 409, and 429 from a thrown `RateLimitedError`)
reach the caller.
files: tests/unit/stores/FeedImport.test.ts (new); possibly tests/unit/setup/storeMocks.ts (see open question 1)
depends: TASK-7
risk: medium. The shared `ApiService` module mock doesn't export
`RateLimitedError`, so the 429 test needs a mock tweak, which could touch shared
test setup.

TASK-9: Add the `en` strings and their `types/translation.ts` keys: sidebar
label / modal title ("Import OPML", title case like `add_feed`), file-step hint,
select all / select none, "n selected" (`_singular`/`_plural`), row label
"Already subscribed", "Import" button, progress "Importing feeds… n of m",
result headings Added / Already subscribed / Didn't work (with counts, as
`_singular`/`_plural` pairs if the count is in the string), reasons
"Didn't respond" / "Not a feed", "Import another file", a new close label, a
new generic import error, and upload errors (unreadable / no feeds / more than
500, already running, too many imports). `en` only. No other locale here.
files: src/lib/i18n/en.ts, src/lib/types/translation.ts
depends: none
risk: medium. After this task, `npm run check` fails on `de/es/fr/it/ru` until
TASK-13 lands. That's expected and must not be "fixed" by writing those locales
here. Where the close key goes (`layout` vs `feeds`) is open question 2.

TASK-10: Build `components/feeds/FeedImportModal.svelte` on `ui/ContentModal`
with the four views. Picker: `FileUpload` with `accept=".opml,.xml"`, uploads on
pick, per-status error text in the modal. Preview: select-all/none toggle, "n
selected", scrollable `Checkbox` rows with title plus muted truncated URL,
already-subscribed rows disabled/unticked with label, Import disabled at 0.
Progress: `ProgressBar` plus "n of m". Result: three groups with counts,
failed rows with URL and reason, "Import another file" and Close. On open,
call `refresh()` once and route by stage (`running` → progress and start
polling, `finished` → result, `parsed`/`null` → picker). Poll about once a
second only while `running`, using a timer started from handlers or `onMount`
and cleared on `finished`, on the ~2-minute safety cutoff (shows the generic
error and Close), and in `onDestroy`. No `$effect`. A `select` failure shows
the generic error and returns to the picker. Stop the loading indicator on
every path (`try/finally`, rule 15.7). All text through `ts.get`. Selection,
grouping and progress come from `FeedImportService`.
files: src/lib/components/feeds/FeedImportModal.svelte (new)
depends: TASK-3, TASK-4, TASK-5, TASK-6, TASK-7, TASK-9
risk: high. The biggest piece: four views, timer lifecycle, error mapping, and a
500-row list that must stay usable in the mobile bottom sheet. It is also where
the standards the brief lists (no inline logic, one-line attributes, `class:`
first, hand formatting) are easiest to slip on. Consider having the developer
do the views first and polling second within this task.

TASK-11: Wire it up. Mount `FeedImportModal` in `routes/feeds/+page.svelte`
with `{#if feedImport.modalOpen}` next to `FeedBrowserModal`. Add the third
sidebar entry in `FeedNavigation.svelte` below "Browse feeds", with the same
markup/classes, a lucide `file-up` (or `upload`) icon at `size={16}`, and an
onclick that sets `feedImport.modalOpen = true` and calls `handleNavigation()`.
files: src/routes/feeds/+page.svelte, src/lib/components/feeds/FeedNavigation.svelte
depends: TASK-7, TASK-9, TASK-10
risk: low. Copies two existing patterns exactly.

TASK-12 (optional, only if cheap): Add a component test that mounts the modal
in `running` with fake timers, unmounts it, and asserts no further `refresh()`
calls.
files: tests/components/feed-import-modal.test.ts (new); possibly tests/components/helpers/context.ts overrides
depends: TASK-10
risk: medium. `ContextHarness` doesn't seed `Feeds`/`FeedImport`, so this may need
harness overrides. The brief says "welcome if cheap, not required". Skip it if
that means changing shared harness code.

TASK-13 (final): Hand the new `feeds` (and, if chosen, `layout`) keys to the
`translator` agent for `de`, `es`, `fr`, `it`, `ru`, following `docs/I18N.md`
and its glossary ("Feeds" stays "Feeds" in `de`/`es`, "flux" in `fr`, "feed" in
`it`, "ленты" in `ru`). Add "OPML" to the "Brands and product names" line in
`docs/I18N.md` in the same change. Then run `npm run check`, `npm run lint` and
`npm test`. All three must pass.
files: src/lib/i18n/de.ts, src/lib/i18n/es.ts, src/lib/i18n/fr.ts, src/lib/i18n/it.ts, src/lib/i18n/ru.ts, docs/I18N.md
depends: TASK-9 (and everything else for the final green run)
risk: low. Data-only, owned by the translator agent. `de` goes through it too
(Job notes), not written by the developer.

Implementation-notes items the brief asks for (no task, just record them):
`ApiService.post` stringifies `FormData` (finding, not fixed). `ui/ProgressBar`
should replace the inline bars in `calendars/ImportModal`, `contacts/ImportModal`
(and arguably `FileUpload`) as a follow-up. The end-to-end click-through against
a local api is left to the owner (Job notes). The desktop/mobile shells pick
this up on their next frontend sync.

## Unclear / open questions

1. **Catching 429 in tests.** The store must catch `RateLimitedError` (it is
   thrown, never returned). The stores-project mock of `$lib/services/ApiService`
   exports only `default`. Options: (a) change the shared mock in
   `tests/unit/setup/storeMocks.ts` to re-export the real `RateLimitedError` /
   `NetworkError` via `importOriginal`, a small change that every store test
   inherits; (b) a per-file `vi.mock` override in `FeedImport.test.ts` only;
   (c) catch 429 in the modal instead of the store, as `ExportSettings.svelte`
   does, which keeps the store simple but puts error mapping in the component
   and leaves 429 untested. My recommendation is (a), but it touches shared test
   infra, so the owner should confirm.
2. **Where the close key lives.** `layout.close` (generic, next to
   `modal_cancel`, reusable) or `feeds.import_close` (keeps every new key in
   `feeds` as the brief's i18n section says)? Either works. The brief only
   says "a new key".
3. **`FileUpload` extension shape.** The brief offers "read the bound input or
   add a `file` bindable". Neither lets the modal react to a pick without
   `$effect`, so a callback prop (e.g. `onfile(file: File)`) is needed. Is
   that acceptable, and should `FileUpload`'s own base64 progress/success box
   stay visible in this modal (it will look like an extra step), or is
   that fine for now?
4. **One or two 422 messages.** The upload 422 covers both validation failures
   (wrong extension, >1 MB, no file) and content failures (unreadable, DTD, no
   feeds, >500). The frontend can't tell them apart without parsing the api's
   message text, which STANDARDS 13.3 discourages. I'd suggest one message
   that covers all of them. The brief allows either.
5. **Select-all logic.** Deciding whether the toggle reads "select all" or
   "select none", and what it sets, is a small piece of pure logic not in the
   brief's list of three service functions. OK to add it to
   `FeedImportService` (rules 1.1/3.2), or keep it to the three listed?
6. **Closing mid-import.** Polling is tied to the modal, so if the user closes
   it during `running`, the sidebar won't reload until they reopen it (the
   reopen's `refresh()` then sees `running` → `finished` and reloads). That
   follows the brief as written. Just confirming it's intended.
7. **`npm run check` between TASK-9 and TASK-13.** It will fail on the five
   non-`en` locales until the translator runs. The developer should not treat
   that as a blocker for TASK-10..12, but "done" is only after TASK-13.

## Answers (owner's session, 2026-11-13)

1. **429 in tests:** (a). Re-export the real `RateLimitedError`/`NetworkError`
   from the shared mock in `tests/unit/setup/storeMocks.ts` via
   `importOriginal`. The store catches `RateLimitedError` and returns 429.
2. **Close key:** `feeds.import_close`. Every new key stays in `feeds`,
   including the generic error (`feeds.import_error_generic` or similar).
3. **`FileUpload`:** a callback prop (e.g. `onfile(file: File)`) plus `accept`
   is fine. Skip the `file` bindable unless the modal actually reads it.
   The base64 progress box can stay; the modal moves to the preview right
   after the upload.
4. **422:** one message that covers every upload 422.
5. **Select-all logic:** yes, put it in `FeedImportService` as a fourth
   function, with tests.
6. **Closing mid-import:** intended (owner confirmed). Polling stays in the
   modal; the reopen's `refresh()` reloads the sidebar.
7. **`npm run check` between TASK-9 and TASK-13:** expected to fail on the
   other locales; not a blocker. Done is after TASK-13.
