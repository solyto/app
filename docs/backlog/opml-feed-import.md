# Backlog: import feeds from an OPML file

created: 2026-11-13

## What

Let users import their feeds from another reader's OPML export. In the feeds
sidebar, "Import OPML" opens a modal with four steps:

1. **Pick a file.** The user chooses an `.opml`/`.xml` file and it uploads.
2. **Preview.** Every feed in the file is listed with a checkbox, **all ticked
   by default**. Feeds the user already subscribes to are greyed out, unticked
   and can't be ticked, with a short "Already subscribed" label.
3. **Progress.** After "Import", a progress bar fills as the api works
   through the feeds (it fetches 25 at a time, so a normal file takes
   seconds).
4. **Result.** The modal **stays open** and shows what worked and what
   didn't:
   - **Added (n)**
   - **Already subscribed (n)**: feeds the user got between preview and
     import.
   - **Didn't work (n)**: each with its URL and a reason. "Didn't respond"
     (`unreachable`) means the site may be down, try again later. "Not a
     feed" (`not_a_feed`) means the URL is wrong.

   One button closes the modal. The sidebar already shows the new feeds,
   because the store reloads them when the import finishes.

The api side is `api/docs/backlog/opml-feed-import.md`. Its "State" section is
the contract this entry builds on. Field names and status values are final
there. Don't rename or reinterpret them here.

## Why

Users coming from another reader have tens to hundreds of feeds. Today every
feed has to be added by hand through "Add feed". The owner's bar: it should
feel like a few seconds even for 500 feeds, show progress, and say clearly
what worked and what didn't.

## Out of scope

Owner decisions, 2026-11-13:

- Folders. Feeds are listed flat, with no grouping by folder.
- OPML export.
- Choosing a title per feed in the preview. The title comes from the file.
- Cleaning up the Calendar and Contacts import modals
  (`components/calendars/ImportModal.svelte`,
  `components/contacts/ImportModal.svelte`). They are the closest existing
  flow, but they break several standards (see Notes). Copy the flow, not the
  code, and don't touch them.
- Retrying failed feeds from the result screen.
- The desktop and mobile shells (`/workspace/desktop`, `/workspace/mobile`).
  Unverified whether they wrap this app. If they do, they get the feature for
  free. Check, don't change.

## Notes

### Where things go

- **Button:** `components/feeds/FeedNavigation.svelte`, a third entry below
  "Add feed" and "Browse feeds" (`:89-110`). Same markup and classes as those
  two, a lucide icon in the same style (e.g. `file-up` / `upload`), and it
  calls `handleNavigation()` like the others so the mobile sidebar closes.
- **Store:** new `state/FeedImport.svelte.ts`, shaped like
  `state/CalendarImport.svelte.ts` (constructor injection with defaults, rule
  15.2; `Symbol` key, `setFeedImport()`/`getFeedImport()`). Created in
  `routes/feeds/+layout.svelte` next to `setFeeds()`, so it only lives while
  the feeds feature is mounted.
  - `$state`: `modalOpen`, and the current import state from the api (the
    `FeedImportState` type).
  - Methods: `upload(file)`, `select(urls)`, `refresh()`, plus whatever
    resetting needs. When `refresh()` sees the stage change from `running` to
    `finished`, it calls the `Feeds` store's `load()` so the sidebar updates.
    Not on every `finished`: opening the modal on an import that is already
    done must not reload the sidebar. Inject `Feeds` like any other
    collaborator.
  - **Uploading:** `ApiService.post` does **not** work with `FormData`. Its
    `typeof body === 'object'` check is true for `FormData`, so it would
    `JSON.stringify` the file (`services/ApiService.ts:263-271`).
    `postWithStatus` (`:273`) handles `FormData` correctly and returns the
    status. Use it for both POSTs. The status is needed anyway (below). Do
    not fix `post` in this job. Mention it in the implementation notes as a
    finding.
- **Modal:** new `components/feeds/FeedImportModal.svelte`, mounted in
  `routes/feeds/+page.svelte` with `{#if feedImport.modalOpen}`, like
  `FeedBrowserModal` (`:16-18`). Built on `ui/ContentModal.svelte`.
- **Routes:** `config/apiRoutes.ts`, in the `feeds` block (`:249-258`):
  `importStart` (`/feeds/import`), `importSelect` (`/feeds/import/select`),
  `importState` (`/feeds/import/state`).
- **Types:** `types/feed.ts`: `FeedImportState`, `FeedImportEntry`,
  `FeedImportStage` (`'parsed' | 'running' | 'finished'`),
  `FeedImportStatus` (`'pending' | 'subscribed' | 'already_subscribed' | 'unreachable' | 'not_a_feed'`).
  `status` is `FeedImportStatus | null`. Plain strings and numbers, no date
  conversion needed (rule 15.9).
- **Pure logic:** new `services/FeedImportService.ts` (rule 15.8):
  - the initial selection: every URL except `already_subscribed`;
  - grouping finished entries into added / already subscribed / failed, the
    failed ones with their reason;
  - the progress fraction from `processed`/`total`, safe when `total` is 0.

  The component calls these. It doesn't compute them inline (rules 1.1,
  3.2).

### Behaviour details

- **On open:** call `refresh()` once.
  - `running`: jump straight to the progress view. The user closed the modal
    mid-import, and the job kept going on the server.
  - `finished`: show the result view, with a way to start a new import.
  - `parsed`: show the file picker. A stale preview is not worth restoring.
  - 404: show the file picker.
- **Polling:** only while the stage is `running`, about once a second. The
  timer belongs to the modal's lifecycle: start it when the import starts (or
  on open, if already `running`), clear it when `finished` arrives, and clear
  it in `onDestroy` (rules 5.2, 5.4). As a safety net, stop polling after
  about 2 minutes without `finished` and show the generic error with a close
  button. The api's worst case is about 100 s, and it marks crashed jobs
  `finished`, so this should never trigger. The Calendar modal's recursive
  `setTimeout` with no cleanup (`calendars/ImportModal.svelte:78-104`) keeps
  polling after the modal closes. Don't copy it. **No `$effect`** for any of
  this (`docs/policies/limited-use-of-derived-and-effect.md`, section 5).
- **Errors from the upload, by status.** Each gets its own translated
  message, shown in the modal, not only as a toast:
  - 422: "This file couldn't be read, or it has no feeds / more than 500
    feeds." Two messages are fine if the wording reads better; the api uses
    422 for both.
  - 409: "An import is already running."
  - 429: "Too many imports, try again later."
  - anything else: the generic error.
- **Errors from `select`:** any non-2xx (404: the state expired, 409:
  another tab already started the import, 422: nothing valid selected)
  shows the generic error in the modal and goes back to the file picker. No
  separate messages.
- **Selection:** a "select all / none" toggle above the list and a "n
  selected" count. "Import" is disabled at 0. Long lists scroll inside the
  modal and don't stretch it (500 rows must stay usable on mobile).
- **Row:** the title, and below it the URL, truncated and muted. The URL is
  what tells two "Blog" feeds apart.
- **Loading indicator:** stop it on every exit path, including the error
  branches (rule 15.7).

### Use what exists (section 7)

- `forms/Checkbox.svelte` for the rows. `ui/buttons/TextButton.svelte` for
  Import, Close, select-all, etc. No raw `<button>`s for those. The sidebar
  entry is the 7.4 exception, and it matches its neighbours.
- **File picking:** `forms/FileUpload.svelte` turns the file into base64 and
  exposes the `<input>` element via `bind:input`. The import needs the raw
  `File` for `FormData`. Read it from the bound input, or add a small `file`
  bindable to `FileUpload` (rule 7.2, extend, don't fork). No new raw
  `<input type="file">` in the feature.
- **Progress bar:** there is no `ui/` progress bar. The Calendar and Contacts
  modals each paste the same inline bar (`calendars/ImportModal.svelte:173-185`,
  `contacts/ImportModal.svelte:~176`). A third copy is not allowed (rule 1.6:
  two across files are one component). Create `ui/ProgressBar.svelte` (value
  prop `0..1`, rule 3.4), taking its classes from those two bars, and use it
  here. Switching the two existing modals to it is out of scope. Mention it
  in the implementation notes as a follow-up.

### Standards to watch (the reasons this is spelled out)

The Calendar import modal is the nearest example and breaks these:

- Hard-coded `"Import"`, `"URL"`, `"Username"`, `"Secret"` (rule 8.1). Every
  visible word here goes through `ts.get`.
- A timer with no cleanup (rules 5.2, 5.4, see above).
- Local copies of selection state with hand-written push/filter (fine to have
  a `$state` selection set here, since it is rendered; keep the logic in the
  service).

And in general:

- No comments that narrate (section 10).
- Attribute expressions on one line (section 1).
- `class:` before ternaries (1.3).
- Formatting by hand: tabs, single quotes, semicolons, no trailing commas
  (1.10).

### i18n

New keys in the `feeds` section of `types/translation.ts` and `i18n/en.ts`.
`de.ts` too if you're sure. Every other locale through the `translator` agent
(`docs/agents/translator.md`, `docs/I18N.md`). Never translate on the fly.
`npm run check` must pass with all locale files in sync. The locale files
today are `en`, `de`, `es`, `fr`, `it`, `ru`. Both AGENTS.md files list fewer,
so trust the directory.

Strings needed (wording is a proposal; the neighbours `add_feed: 'Add Feed'`
and `browse_feeds: 'Browse Feeds'` use title case, so match them for the
sidebar label):

- sidebar label / modal title: "Import OPML"
- file step hint: "Choose the OPML file you exported from your other feed
  reader."
- select all / select none; "%d selected"
- "Already subscribed" (row label)
- "Import" (button)
- progress: "Importing feeds… %d of %d"
- result headings: "Added", "Already subscribed", "Didn't work"
- reasons: "Didn't respond", "Not a feed"
- "Import another file"; close uses the existing `ts.get.layout.modal_close`
  if it exists (check), otherwise a new key
- errors: unreadable file / no feeds / too many feeds (max 500), already
  running, too many imports
- use `_singular`/`_plural` pairs where a count is in the string (I18N.md
  "Plurals")

Glossary: "Feeds" stays "Feeds" in `de` and `es`, "flux" in `fr`, "feed" in
`it`, "ленты" in `ru`. "OPML" is a format name and stays untranslated. Add it
to the "Brands and product names" line in `docs/I18N.md` in the same change.

### Tests (`docs/TESTING.md`)

- `tests/unit/`: `FeedImportService`. Initial selection skips
  `already_subscribed`. Grouping puts each status in the right group and
  keeps the reason. The progress fraction handles `total = 0`.
- `tests/unit/stores/`: `FeedImport`, with an injected `ApiService` mock.
  - `upload` sends `FormData` with the file through `postWithStatus` to
    `importStart`.
  - `select` posts `{ urls }`.
  - a `refresh` that sees `running` → `finished` calls the `Feeds` store's
    `load()` once; a `refresh` that finds `finished` from the start doesn't
    call it.
  - The status code reaches the caller, so the modal can pick the message.
- No markup tests. Polling cleanup is component lifecycle; a component test
  with fake timers that unmounts mid-import and asserts no further `refresh`
  calls is welcome if cheap, not required.

### Order and done

- Depends on the api entry. Build it against the contract, then check it end
  to end against a local api (`npm run dev` + the api) with a real export
  (Miniflux/FreshRSS/Feedly) once the api exists.
- Release only after the api is deployed (api `docs/STANDARDS.md` 13.7).
- Done means `npm run check`, `npm run lint` and `npm test` all pass.
