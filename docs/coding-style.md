# Human vs. AI coding style — a two-feature comparison

This report compares two feature stacks in the solyto frontend written by
different authors:

- **`todos`** — built and evolved by hand (the repo owner) over many commits.
- **`time-tracking`** — built by an AI coding agent (`deepseek-v4-flash` via the
  opencode-go profile), most recently reworked in the archived job
  `docs/jobs/archive/joke_time-tracking-improvements/` (see its
  `implementation.md` header `developer: deepseek-v4-flash (opencode-go)` and
  `verdict.md`).

The question the brief asks is deceptively simple: *what does the human do that
the AI doesn't, and vice versa?* This report answers it with concrete,
checkable evidence — file paths, line numbers, and objective counts — rather
than taste.

The two features are not the same size or maturity, so the point is **not**
"which is better". It is to characterise the two styles and to see which one
tracks the repo's own written conventions (`docs/BEST_PRACTICES.md`,
`STATE_SERVICES.md`, `COMPONENTS.md`, `DATA_LAYER.md`, `TESTING.md`).
Surprisingly often, the answers are not the ones a reader would guess.

---

## 1. Methodology

- **Read-only.** Nothing under `src/**` or `tests/**` is modified by this job;
  the only artifact produced is this report.
- **Ground truth is the repo's own policies**, not generic Svelte taste. The
  five policy documents under `docs/` were written for this codebase and both
  features are measured against them.
- **Objective metrics** (line counts, file counts, test counts, i18n key
  counts, `$derived` usage, comment counts) were collected directly with
  `wc`/`grep`/`git`; every number in the tables below is reproducible.
- **Authorship.** Both features commit under the same git author identity, so
  authorship is established from the brief plus the archived AI job, not from
  `git blame`. Time-tracking's history is dominated by one large AI commit
  (`b25801c "time tracking improvements"`, 33 files, +2441/−579) plus a small
  follow-up (`48cea28`); todos accumulated ~33 separate commits over months.

### Metrics snapshot

| Metric (feature source)                    |                      todos (human) |                 time-tracking (AI) |
| ------------------------------------------ | ---------------------------------: | ---------------------------------: |
| State store                                |       `Todos.svelte.ts` — 523 LOC |   `TimeTracking.svelte.ts` — 171 LOC |
| Pure domain services                       | 4 files — 249 LOC (`Todo*Service`) | 1 file — 46 LOC (`TimeTrackingGroupingService`) |
| Types                                      |             `todo.ts` — 133 LOC |       `time_tracking.ts` — 97 LOC |
| Components                                 |             34 files — 2848 LOC |              11 files — 1517 LOC |
| Routes (`+layout`/`+page`/`[id]`)          |                2 files — 96 LOC |                3 files — 301 LOC |
| **Feature source total**                   |                       **3849 LOC** |                       **2132 LOC** |
| Store methods (async / total)              |                         31 / ~48 |                           16 / ~19 |
| Component tests                            | Counter, NoTodos (via `logic-leaves`), `context-harness` | none |
| Store/service test LOC                     |    ~933 (store 367 + services 540 + component) |            160 (store 64 + service 96) |
| Test : source ratio (approx.)              |                             ~0.24 |                              ~0.075 |
| i18n keys in feature block (`en.ts`)       |                     61 (`todos`) |           54 (`timeTracking`) |
| Why-comments in feature source             |                  ~0 in components |                        8 comment lines |
| `aria-label` usage in feature components   |                          0 files |                          2 files |
| Dead code (unreferenced component LOC)     |                 0 (`FindCategoryMenu` is used by `settings/WorkspaceEdit`) |      **211 LOC** (`PomodoroWidget.svelte`) |

Counts are of the feature's own source (state + services + types + components +
routes) and its own tests; shared infra (ApiService, i18n, harnesses) is
excluded. Reproduce with `wc -l` / `grep -rc`.

---

## 2. State service shape

This is the layer with the clearest, most policy-relevant differences.

### 2.1 Dependency injection

`docs/STATE_SERVICES.md` names `Todos` as *the reference* for constructor
dependency injection and marks the field-initialiser style (citing `Clipboard`)
as the "older — not the target style".

- **Human (`todos`)** follows the preferred shape exactly:
  `Todos.svelte.ts:62-72` injects `auth`, `apiService` and `localStorage` with
  defaults that preserve `new Todos()`.
- **AI (`time-tracking`)** uses the older field-initialiser shape:
  `TimeTracking.svelte.ts:26-31` declares `auth = getAuth();` and assigns
  `this.apiService = this.auth.apiService` in the constructor. It defaults to
  the shared `auth.apiService` (good), but it cannot be overridden by a
  constructor argument and forces tests to mock the `Auth` module.

This is the one place where the human is *directly* the textbook example the
policy cites, and the AI is the cited anti-pattern.

### 2.2 Member ordering

`docs/STATE_SERVICES.md` §"Member ordering" says `Todos` is the reference order:
constants → `$state` fields → collaborators → constructor → public methods →
`Symbol` + `setX`/`getX` at the bottom.

- Both stores follow the order well. `TimeTracking.svelte.ts` has no `static
  readonly` constants, no `Symbol`-adjacent deviations, and puts
  `setTimeTracking`/`getTimeTracking` at the bottom (`:163-171`) — compliant.
- The AI's store is noticeably **flatter and more consistent** in its CRUD
  bodies: every mutator is `const res = await …; if (res) await this.load…;
  return res;` (`TimeTracking.svelte.ts:60-153`). The human's store mixes
  `return res;`, `return ok;` and `return Promise.resolve(res !== null);` in the
  same file (`Todos.svelte.ts:280-317` vs `:331-359`), including
  `return Promise.resolve(...)` on already-`async` methods — redundant wrapping
  that the AI never does.

### 2.3 Delegation to pure services

`docs/STATE_SERVICES.md` §"Delegate pure logic to `services/`" calls out `Todos`
as the model: it holds four service instances as fields
(`Todos.svelte.ts:57-60`) and delegates filtering, sorting, grouping and scoring.

- **Human:** 4 single-purpose services (`TodoFilterService`,
  `TodoSortingService`, `TodoGroupingService`, `TodoRelevanceService`), each
  `new`-able, pure, and unit-tested.
- **AI:** 1 service (`TimeTrackingGroupingService`) with a good "why" docblock
  (`:13-17`). But other pure logic that the policy says should live in a service
  is left inline in components:
  - **`groupByDate` is duplicated verbatim** in
    `GroupedEntries.svelte:18-30` and `routes/time-tracking/[id]/+page.svelte:67-79`.
  - Week/today boundary math and aggregation live inline inside `$derived`
    closures in `DashboardView.svelte:24-46`.
  - `formatDuration` — pure string formatting — lives on the store
    (`TimeTracking.svelte.ts:155-160`), which `docs/DATA_LAYER.md` would place
    in `helpers/` (there is a `NumberHelper`/`FormatHelper` family for this).

The AI clearly *can* extract a service (it did, and tested it well); it just
doesn't do so as consistently as the human.

### 2.4 `load()` + `loaded` and error handling

`docs/STATE_SERVICES.md` §"The `load()` + `loaded` convention" wants sub-loads
via `Promise.all` and a single `if (res)` assignment; `docs/BEST_PRACTICES.md`
§"Early returns" and the general robustness rules favour explicit handling.

- **Human:** `Todos.load()` (`:74-97`) sequences named steps and wraps the
  parallel sub-loads in `try { … } finally { this.loadHideIt(); }` (`:92-96`),
  and `loadWorkspaces` has a retry parameter (`:107-118`). Defensive,
  failure-aware, and the reason its store test file is 367 lines.
- **AI:** `TimeTracking.load()` (`:33-40`) is a bare `await Promise.all([…])`
  followed by `this.loaded = true` — no `try`/`catch`/`finally`, no retry, no
  guard if one sub-load rejects. Simpler and readable, but less robust.

### 2.5 UI state on the store

`docs/COMPONENTS.md` §"Local UI state via `$state`" says "UI-only state stays in
the component; anything the route, another component or the backend cares about
belongs on a store."

- **Human:** the store carries transient UI flags — `quickCreateOpen`
  (`Todos.svelte.ts:53`, written by `TodoCreate.svelte:62,73` and read by
  `ViewSwitcher.svelte:10`) and `recentlyCreated` (`:52`, a 10-second highlight
  set by `quickCreate`). `sortByScore`/`hideItActive` on the store are defensible
  (shared/persisted), but `quickCreateOpen` is arguably a component concern.
- **AI:** keeps every modal/drawer flag in the component that owns it —
  `showEntryCreate` (`routes/time-tracking/+page.svelte:13`), `editModal` /
  `deleteModal` / `editingEntry` (`[id]/+page.svelte:32-35`),
  `showProjectCreate` (`+layout.svelte:15`). Cleaner separation.

Here the AI is the more policy-compliant one.

---

## 3. Layout vs. page responsibilities

`docs/DATA_LAYER.md` says each feature layout "creates its feature stores **and
calls `load()` on them**".

- **Human:** `routes/todos/+layout.svelte:1-11` is minimal — it only calls
  `setTodos()`/`setTags()`; the actual bootstrap (`onMount` → `todos.load()`,
  viewport defaulting, `tags.load()`) lives in `routes/todos/+page.svelte:28-37`.
- **AI:** `routes/time-tracking/+layout.svelte:10-27` does
  `setTimeTracking()`, `onMount` → `tt.load()`, and gates the whole shell behind
  `{#if tt.loaded}` — it also owns the navigation and the create/edit project
  modal orchestration. This matches the documented "layout bootstraps the
  feature" pattern more literally.

Two corollaries:

1. **Single responsibility of the layout.** The AI's layout is a full shell
   (nav + load + 2 modals + gate); the human's is a one-liner. The human's
   layout is *simpler*, the AI's is *closer to the documented intent*. Both are
   defensible; they are simply different axes.
2. **Nested route.** Time-tracking has a real detail route
   (`[id]/+page.svelte`, 205 LOC) and derives the selected project from
   `page.params.id` (`+layout.svelte:18`, `[id]/+page.svelte:37-39`). Todos has
   no detail route — selection is pure store state (`activeWorkspace`,
   `activeFilters`). The AI's route-driven selection survived reloads and deep
   links; the human's filter state is rebuilt from `page.url.searchParams` in
   `checkUrlForFilter()` (`Todos.svelte.ts:148-159`).

---

## 4. View / component decomposition

- **Human (`todos`)** decomposes along *view mode* and *prop*: four view
  variants (`views/{ListView,CardView,OverviewView,KanbanView}`), a per-field
  `props/` folder (14 tiny components: `Title`, `Category`, `Priority`, …), an
  `actions/` folder (`TodoCreate`, `TodoDelete`, `HideIt`, `SortByScore`) and a
  desktop/mobile navigation split (`TodoNavigationDesktop` 149 LOC /
  `TodoNavigationMobile` 216 LOC). Components are small and single-purpose, at
  the cost of 34 files and some duplication (`getBgColor` is copy-pasted in
  `Card.svelte:31-40` and `CompactCard.svelte:15-24` — allowed by the "three or
  more times" DRY rule).
- **AI (`time-tracking`)** decomposes along *screen/role*: one navigation
  component (`TimeTrackingNavigation.svelte`, 363 LOC — the largest file in
  either feature), one entry component, one entry editor, one project editor,
  and one component per dashboard widget. Views are selected by a URL `?tab=`
  param (`routes/time-tracking/+page.svelte:15-19`,
  `TimeTrackingNavigation.svelte:31-35`) rather than a component switcher.

The AI's `TimeTrackingNavigation.svelte` concentrates project list, category
CRUD, a colour picker, inline rename, two delete-confirmation modals and the
mobile drawer in one 363-line component. `docs/COMPONENTS.md` §"Keep the
`<script>` readable … If it stops being scannable, split components" suggests
the human's instinct (split by concern) is the documented one, though the AI
keeps the file logically sectioned with snippets.

**Dead code:** `PomodoroWidget.svelte` (211 LOC) is imported nowhere in `src/`
(verified with `grep -rl`). It is the single largest dead-code artifact found in
either feature. The human has no equivalent (the one candidate,
`FindCategoryMenu.svelte`, is used by `settings/WorkspaceEdit.svelte`).

---

## 5. Reactivity patterns (`$derived` discipline)

`docs/BEST_PRACTICES.md` §"`$derived` discipline" is explicit: use `$derived`
only for genuine, side-effect-free derivations read while rendering, and move
`filter().map().sort()` chains into a method or service.

- **Human:** modest use of `$derived` (7 files, one or two per file), and the one
  aggregation is `OverviewView.svelte:19-42` using the correct **`$derived.by`**
  form. Filtering/sorting/grouping is never a `$derived` — it is `Todos.useFilters`,
  a method (`Todos.svelte.ts:161-196`), exactly as the policy prescribes.
- **AI:** two genuine deviations:
  1. **`$derived(() => …)` misuse** in `DashboardView.svelte:24,35,37,46` and
     `StatisticsView.svelte:52`. In Svelte 5 this makes the derived value *a
     function*, forcing call sites like `todayBreakdown()`/`weekBreakdown()`
     (`:58,63`) and `categoryBreakdown()` (`:66,67`) to invoke it. It happens
     to work, but it is the classic runes footgun; the correct form is
     `$derived.by(...)` — which the *same AI* uses correctly elsewhere
     (`EntryCreate.svelte:85`, `TimeTrackingNavigation.svelte:31`,
     `routes/time-tracking/+page.svelte:15`). Inconsistent within a single
     feature.
  2. **Aggregation chains inside `$derived`** (`StatisticsView.svelte:52-64`
     builds a `Map`, sums minutes and sorts — precisely the "`filter().map().sort()`
     hidden behind `$derived`" the policy says to extract).

- **Reactive time:** the human uses `SvelteDate` from `svelte/reactivity` in the
  filter pipeline (`Todos.svelte.ts:165-171`) so the "auto-generated due within
  3 days" window stays reactive; the AI uses plain `new Date()` inside
  `$derived` (`DashboardView.svelte:25,38`), which will not re-evaluate when the
  clock moves.

`routes/todos/+page.svelte:26` has a harmless redundant alias
(`let view = $derived(todos.view)`), but it is not a violation.

---

## 6. Loading-indicator discipline

`docs/COMPONENTS.md` §"Loading feedback": "Always `start()` before the await and
`stop()` on **every** exit path."

- **AI (`time-tracking`)** is disciplined. `EntryCreate.onSave`
  (`:118-141`), `ProjectCreate.onSave` (`:47-68`), `TimerWidget.startTimer`
  (`:24-34`) all check validity *before* `loadingIndicator.start()`, or stop on
  every path. No leak was found.
- **Human (`todos`)** has several early returns *after* `start()` with no
  `stop()`, leaking the global spinner:
  - `props/Title.svelte:54-65` — `onsubmit()` calls `start()`, then
    `if (todoTitle === '') return;` (`:59-61`) without stopping.
  - `props/Description.svelte:88-99` — same shape at `:93-95`.
  - `props/Subtask.svelte:61-72` — same shape at `:66-68`.
  - `ListAndAdd.svelte:57-76` — `start()` then `if (value.trim() === '') return;`
    (`:60-62`).
  - (`props/Category.svelte:59-90` gets this right by calling `stop()` before its
    empty-title return — showing the human knows the rule, just doesn't apply it
    uniformly.)

This is the clearest instance of the AI's mechanical consistency beating the
human's hand-written inconsistency.

---

## 7. Error handling

- **Human:** real error surfaces. `Todos.loadWorkspaces` retries once
  (`:107-118`); `Category.svelte:78-86` and `Tags.svelte:73-83` call
  `notifications.error(ts.get.todos.category_error / tag_error)` when a create
  fails; `quickCreate` returns a discriminated `{ ok, recurrenceIgnored }`
  result (`Todos.svelte.ts:249-278`) that `TodoCreate.svelte:86-96` turns into
  success/warning notifications.
- **AI:** close to fire-and-forget. Store mutators discard results and reload
  (`TimeTracking.svelte.ts:60-153`); the only user feedback is the modal closing
  unconditionally in `EntryCreate.onSave:133-140` / `ProjectCreate.onSave:52-67`,
  even if the API call failed. There are no `notifications.error(...)` calls in
  the time-tracking feature (verified by grep).

The human treats the API as fallible; the AI treats "await returns" as success.

---

## 8. Comments

`docs/BEST_PRACTICES.md` §"Comments explain why, not what" cites
`Todos.svelte.ts` as the reference (the `// Restore synchronously …` and
`// Always re-apply hide-it …` blocks) and says not to leave commented-out code.

The current code contradicts the doc in an interesting way:

- **`Todos.svelte.ts` contains zero comments.** The two comments the policy
  quotes were introduced in `d7d4d92` and removed in `a34275e` (`git log -S`);
  the reference example is now stale. All 34 todos components and both routes
  also contain **no `//` comments at all**; `ScoreBar.svelte:29` even carries a
  commented-out fragment (`<!-- left[-56px] left-2px -->`), which the policy
  explicitly forbids.
- **The AI's code is where the "why" comments actually are**: 8 comment lines in
  the feature, e.g. `EntryCreate.svelte:70` ("No silent default to the first
  project"), `:109-111` (why duration-only entries anchor to local noon),
  `TimeTrackingNavigation.svelte:52-53` (why a concrete hex default for the
  colour picker), and the JSDoc block in `TimeTrackingGroupingService.ts:13-17`
  (the "entries without a project are ignored" contract).

So the *human-authored policy* is better honoured by the *AI-authored code* on
this axis. The human's comments migrated into the store tests instead, where
they are genuinely useful (see §11).

---

## 9. i18n, accessibility and shared primitives

### i18n

`docs/COMPONENTS.md` §"i18n — `ts.get.*`": "Never hardcode a UI string in a
component."

- **AI (`time-tracking`)** is consistently translated: every visible string in
  every component goes through `ts.get.timeTracking.*` (grep for bare English
  literals in the feature returns nothing beyond the `—` placeholder and `×`).
- **Human (`todos`)** has real deviations:
  - `Counter.svelte:8` — literal `{todos.length} Todos` (its own test asserts
    `'2 Todos'`).
  - `KanbanView.svelte:27-40` — `'Backlog'`, `'In Progress'`, `'Waiting'`,
    `'Almost done'`, `'Pending'` hardcoded in `getStatusLabel`.
  - `Recurrence.svelte:116,125,144,150` — `Every`, `occurrence(s)`, `Cancel`,
    `Save` hardcoded.
  - `TodoCreate.svelte:121,131,135,139,143,147,159` — placeholder `Enter todo`
    and the legend `Category / Tag / Due Date / Recurrence / Link`.

This is a striking reversal of the common assumption that AI output is the one
littered with hardcoded strings.

### Accessibility

`docs/COMPONENTS.md` §"Accessibility" requires keyboard-reachable clickables and
visible focus.

- **AI:** uses native `<button>` pervasively and gives icon-only controls
  accessible names (`aria-label={ts.get.timeTracking.*}` in
  `TimeTrackingNavigation.svelte:184,212,224,245,300,308` and
  `ProjectCreate.svelte:102,113`).
- **Human:** relies on `role="button" tabindex="0"` on non-native elements in 6
  places, but **no todos component uses `aria-label` at all** — several icon-only
  buttons (e.g. the remove-category button `Category.svelte:121-126`, the
  trash button `DueDate.svelte:51-59`) are unlabelled.

### Shared primitives

Both reuse the shared `ui/` and `forms/` primitives, but the human hand-rolls
more raw inputs where a primitive exists: `Title.svelte:74-82`,
`Link.svelte:80-87` and `Recurrence.svelte:117-123,131-136` use
`<input type="text">`/`<input type="number">` with bespoke classes instead of
`forms/TextInput`/`NumberInput`, which `docs/COMPONENTS.md` §"Prefer the shared
primitives" calls a smell. The AI's forms are assembled from `ContentModal`,
`TextInput`, `NumberInput`, `DateInput`, `DateTimeInput`, `Select` and
`TextButton` throughout (`EntryCreate.svelte:144-208`, `ProjectCreate.svelte:71-145`).

---

## 10. Types

- Both mirror the API in snake_case and keep type-only imports; both are
  policy-compliant.
- **Human:** 133 LOC with a rich set of request/response types
  (`CreateTodoRequest`, `UpdateTodoRequest`, `TodoWorkspace`, `TodoSubtask`, …)
  and filter unions (`TodoFilterType`, `TodoDueAtFilter`). Every declared type is
  used.
- **AI:** 97 LOC. The archived verdict already flagged one **dead type**,
  `TimeTrackingStatisticsRequest` (`time_tracking.ts:74-78`), never referenced by
  `loadStatistics` (which takes inline `from`/`to`/`categoryIds` params). A small
  "declared for completeness, never wired up" habit.

Also note `TimeTracking.loadStatistics` (`:146-153`) **builds a query string by
hand** (`apiRoutes.… + '?' + params.join('&')`). `docs/DATA_LAYER.md` says all
endpoints live in `apiRoutes` and callers should never build URL strings. Query
params aren't modelled in `apiRoutes`, so this is a minor, arguably unavoidable
deviation — but it is still URL construction outside the config layer.

---

## 11. Tests

`docs/TESTING.md` names `Todos` as the first Priority store to test (highest
logic density) and lists `TodoGroupingService`, `TodoRelevanceService` and
`TodoFilterService` among the covered pure logic.

- **Human (`todos`)** invests heavily in tests:
  - Store: `tests/unit/stores/Todos.test.ts` — **367 lines**, covering
    `useFilters` (backlog, hide-it, category/tag, auto-generated visibility),
    URL filters, `quickCreate` recurrence-ignore, sort-by-score, hide-it
    persistence/restore, and concurrency ("respects a toggle issued while `load()`
    is in flight", `:330-365`).
  - Services: `TodoFilterService.test.ts` (280), `TodoSortingService.test.ts`
    (116), `TodoRelevanceService.test.ts` (96), `TodoGroupingService.test.ts` (48)
    — ~540 lines.
  - Components: `todos/Counter` is tested twice
    (`tests/components/counter.test.ts`, `context-harness.test.ts`) and `NoTodos`
    via `logic-leaves.test.ts`.
  - The tests carry **explanatory "why" comments** — e.g. the regression note at
    `Todos.test.ts:111-115` explaining a stale-filter bug. This is the human
    comment style relocated into the test suite, where it is arguably most
    valuable.
- **AI (`time-tracking`)** tests the extracted service well but the feature
  thinly:
  - `tests/unit/services/TimeTrackingGroupingService.test.ts` — 96 lines, 5
    cases including "own colour, not first category", fallback colour, ignores
    project-less entries and no input mutation. Good coverage of the service.
  - `tests/unit/stores/TimeTracking.test.ts` — only 64 lines: `load()`,
    no-active-timer, one `startTimer`, and `formatDuration` cases. The store's
    other mutators are untested (defensible — `docs/TESTING.md` §8 says not to
    test boilerplate CRUD — but `loadStatistics` param building, which *is*
    non-trivial, has no test).
  - **No component tests** for any time-tracking widget, despite
    `TimeBreakdownWidget` being a clean props-driven leaf (the exact shape
    `docs/TESTING.md` §8 Priority-2 says to test).

Test : source ratio is roughly **0.24 (human) vs. 0.075 (AI)**.

---

## 12. Commit granularity

Not code style, but part of the observed behaviour:

- **Human:** `todos` shows ~33 commits over months, including small,
  intent-named fixes (`hide it should apply to backlog`,
  `hide it doesnt always reload`, `Auto-create categories in Todos if
  non-existent`). The feature history reads as a sequence of discovered edge
  cases.
- **AI:** `time-tracking`'s rework landed as one 33-file, +2441/−579 commit
  (`b25801c`) plus a small visual follow-up (`48cea28`). Wide, coherent, and
  decisively big — the opposite of incremental.

---

## 13. Style-characteristics table

Legend: ✅ matches the repo's documented convention · ⚠️ deviates.

| Convention (source doc)                                     | todos (human) | time-tracking (AI) |
| ----------------------------------------------------------- | ------------- | ------------------ |
| Constructor DI (injected collaborators) — STATE_SERVICES     | ✅ reference  | ⚠️ field-init      |
| One class/file, `setX`/`getX`, member order — STATE_SERVICES | ✅            | ✅                 |
| `load()` + `loaded`, parallel sub-loads — STATE_SERVICES     | ✅ (+retry/`finally`) | ✅ (no error handling) |
| Delegate pure logic to `services/` — STATE_SERVICES/DATA     | ✅ 4 services | ⚠️ 1 service; inline `groupByDate`×2, `formatDuration` on store |
| Return semantics (`res`/`ok`, no redundant `Promise.resolve`) — STATE_SERVICES | ⚠️ mixed | ✅ consistent |
| UI-only state stays in component — COMPONENTS                | ⚠️ `quickCreateOpen`, `recentlyCreated` on store | ✅ |
| `$derived` discipline (`$derived.by`, no chains) — BEST_PRACTICES | ✅ `$derived.by` for aggregation | ⚠️ `$derived(() => …)` ×5, aggregation in derived |
| Comments explain why; no commented-out code — BEST_PRACTICES | ⚠️ none; one commented-out fragment | ✅ 8 why-comments (incl. service docblock) |
| Loading indicator stopped on every path — COMPONENTS         | ⚠️ 4 early-return leaks | ✅ |
| Error handling / user feedback — BEST_PRACTICES              | ✅ retry + notifications | ⚠️ fire-and-forget |
| i18n: no hardcoded UI strings — COMPONENTS/DATA              | ⚠️ Counter, Kanban labels, Recurrence, TodoCreate | ✅ fully translated |
| Accessibility: labels + native elements — COMPONENTS         | ⚠️ no `aria-label`; `role="button"` fallbacks | ✅ `aria-label` on icon buttons, native `<button>` |
| Shared primitives — COMPONENTS                               | ⚠️ hand-rolled inputs | ✅ primitives everywhere |
| Types: no dead types, no hand-built URLs — DATA              | ✅ | ⚠️ dead `TimeTrackingStatisticsRequest`; hand-built query string |
| Tests for logic/contracts — TESTING                          | ✅ deep store + 4 service suites + component tests | ⚠️ good service test, thin store test, no component tests |
| No dead components                                            | ✅ | ⚠️ `PomodoroWidget` (211 LOC) unused |

Score (informational): both authors are **9 ✅ / 7 ⚠️**. The counts are
identical, but they land on *different* rules — which is the whole story.

---

## 14. What the human does that the AI doesn't

1. **Evolves in small, narrative commits.** `todos` history reads as a chain of
   specific fixes; the AI lands a feature in one wide change.
2. **Extracts pure logic into multiple dedicated services** (`Todo*Service`)
   before it is strictly necessary, and unit-tests each exhaustively.
3. **Bakes in defensive behaviour**: retry on a failed sub-load, `try/finally`
   so a post-load step always runs, discriminated results
   (`{ ok, recurrenceIgnored }`) instead of bare booleans.
4. **Surfaces API failures to the user** via `UiNotifications` error messages
   and treats create/update as fallible.
5. **Writes the reference DI store** the policy quotes verbatim.
6. **Runs a much deeper store test suite** (367 lines, incl. concurrency and
   regression cases) and keeps test rationale in comments.
7. **Uses `SvelteDate`** to keep time-window derivation reactive.
8. **Splits navigation by viewport** into dedicated desktop/mobile components.

## 15. What the AI does that the human doesn't

1. **Mechanical consistency in CRUD bodies** — one return shape, no redundant
   `Promise.resolve` wrapping.
2. **Stops the loading indicator on every exit path** (the human leaks it four
   times).
3. **Translates every UI string** and **labels every icon-only button**; uses
   native `<button>` over `role="button"` divs.
4. **Assembles forms from shared primitives** (`ContentModal`, `TextInput`,
   `NumberInput`, `DateInput`, `DateTimeInput`, `Select`) instead of hand-rolled
   inputs.
5. **Writes "why" comments** at the non-obvious points (colour defaults, noon
   anchoring, contract assumptions) — the very behaviour the policy documents
   but the human's current code no longer exhibits.
6. **Keeps transient UI state in components**, not on the store.
7. **Drives view selection from the URL** (`?tab=`, `[id]` route), so reload /
   deep-link / back-forward work.
8. **Uses `$derived.by`** where the derivation is a block (and documents pure
   contracts with JSDoc on the service).

## 16. Where each author deviates from the repo's own conventions

- **Human deviations:** i18n gaps (`Counter`, `KanbanView`, `Recurrence`,
  `TodoCreate`); four spinner leaks; no `aria-label`; hand-rolled inputs;
  mixed return semantics; a commented-out markup fragment; UI flags on the store;
  (and, ironically, the absence of the comments the policy attributes to it).
  Note the policy docs are themselves human-authored, so these are the author
  deviating from his own written rules.
- **AI deviations:** the older field-initialiser store shape the docs mark
  "not the target style"; `$derived(() => …)` misuse (inconsistent with its own
  correct `$derived.by` usage); pure logic left inline in components; 211 LOC of
  dead component code; a dead type; a hand-built query string; no error feedback
  on failed mutations; and a thinner test footprint for the feature's own UI.

Neither style is uniformly "clean". The human optimises for **robustness and
incremental understanding**; the AI optimises for **local consistency and
convention coverage**.

---

## 17. Summary — how the styles differ

The human writes like someone who has been burned by the failures the code will
eventually hit. His store is the policy's reference implementation: injected
dependencies, pure logic pushed into four tested services, retries and
`finally` blocks, user-visible errors, and a deep regression-oriented test
suite. Its weaknesses are the classic ones of hand-written code — drift over
time (stale doc comments, four leaked spinners, hardcoded strings in the
older components, hand-rolled inputs) and a tendency to keep UI flags on the
store.

The AI writes like a diligent implementer of the written rules, applied locally
and uniformly, without the accumulated wear of real defects. Its CRUD shape,
loading discipline, i18n coverage, accessibility labelling and use of shared
primitives are consistently better *within each file* than the human's. Its
weaknesses are the classic ones of generated code — a few known runes
footguns (`$derived(() => …)`), logic that should have been extracted left
inline, an unused 211-line widget, a dead type, an unused robustness gap
(no error handling), and a thinner, more "happy-path" test footprint.

Put plainly: **the human's code knows failure modes; the AI's code knows the
style guide.** The gap that matters for this repo is not raw capability — both
produce working, readable code — but *where the effort is spent*: the human
spends it on edge cases and structure, the AI on uniformity and surface
conventions. The policy documents (`docs/BEST_PRACTICES.md` et al.) are, on
balance, followed at least as well by the AI on the axes they measure (i18n,
a11y, primitives, loading discipline, comments), and better followed by the
human on the structural and robustness axes (DI, service extraction, error
handling, tests, incremental change).

A practical reading for future work: the AI's habits are excellent for the
shallow, greppable rules and should be kept; the human's habits are the ones to
copy for the structural, defensive, and testing decisions that the written
policy only gestures at.
