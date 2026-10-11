# Data layer

Policy for the non-UI layers: `src/lib/services/`, `src/lib/helpers/`,
`src/lib/config/`, `src/lib/types/`, `src/lib/i18n/` and the app's data flow.
Read [`docs/BEST_PRACTICES.md`](BEST_PRACTICES.md) first; this document is the
detail behind the "Architecture" and "Data flow" sections of
[`docs/AGENTS.md`](AGENTS.md).

## Data flow

The app has exactly one data flow, and it is one-directional:

```
route/component  →  state store (src/lib/state/*.svelte.ts)
                 →  ApiService (src/lib/services/ApiService.ts)
                 →  REST API at {getApiUrl()}/api/v1
```

- **All routes are client-rendered.** There are no `+page.server.ts`,
  `+server.ts`, `+page.ts`/`+layout.ts` or `load` functions anywhere in
  `src/routes`. Routes must never fetch data; a route's layout (or component)
  calls `store.load()` in `onMount` and the store does the fetching.
- The root `src/routes/+layout.svelte` bootstraps the app-wide stores; each
  feature layout (`src/routes/todos/+layout.svelte`,
  `src/routes/libraries/books/+layout.svelte`, …) creates its feature stores and
  calls `load()` on them — see [`docs/STATE_SERVICES.md`](STATE_SERVICES.md).
- Nothing writes to the API from a component. Components call store methods
  (`todos.changeCompleted(todo, checked)`); the store calls `ApiService`.

## `ApiService` is the single network seam

`src/lib/services/ApiService.ts` is the only place that calls `fetch` for app
data. It owns Bearer auth, headers, JSON/FormData bodies and URL placeholder
replacement.

**Never call `fetch` directly for app data.** If you need a new HTTP operation,
use one of the existing methods:

| Method                 | Verb/route        | Returns on success            | On error      |
| ---------------------- | ----------------- | ----------------------------- | ------------- |
| `list(endpoint)`       | GET               | `ListResponse`                | `null`        |
| `get(endpoint, id)`    | GET + `%s`/`%d`   | `GetResponse`                 | `null`        |
| `create(endpoint, body)` | POST + JSON body | `CreateResponse`              | `null`        |
| `createWithStatus(...)`  | POST             | `{ ok, status }`              | `{ ok: false, status }` |
| `delete(endpoint, id)` | DELETE + `%s`/`%d`| `true`                        | `false`       |
| `update(endpoint, id, body)` | PUT + JSON body | `true`                    | `false`       |
| `post(endpoint, body)` | POST + JSON/FormData | `PostResponse`            | `null`        |
| `postWithStatus(...)`  | POST              | `{ ok, status, data }`        | `{ ok: false, status, data: null }` |
| `postRaw<T>(...)`      | POST              | raw typed body                | throws on non-ok JSON |
| `put(endpoint, body)`  | PUT + JSON/FormData | `true`                      | `false`       |
| `postFormData(endpoint, body)` | POST multipart | parsed JSON body (truthy success) | `false`      |
| `uploadFile(endpoint, id, body)` | POST multipart | `CreateResponse`       | `null`        |
| `image(endpoint)`      | GET               | `Blob`                        | `null`        |

How it works and what callers rely on:

- **Bearer token** is held on the instance (`authToken`) and refreshed via
  `Auth.updateAuthToken`; headers are built by `getApiHeader*`. Stores use the
  shared `auth.apiService` instance ([`STATE_SERVICES.md`](STATE_SERVICES.md)).
- **URL placeholders:** endpoints containing `%s` (string id) or `%d` (number
  id) are substituted by the method. Callers pass the bare endpoint from
  `apiRoutes` plus the id.
- **Semantics:** `null`/`false` on any non-`ok` response — stores pattern-match
  with `if (res)`/`if (ok)`. A rejected network fetch is a different signal: it
  propagates (or is caught) and never triggers the 401-recovery path.
- **401 recovery** is handled once, inside `ApiService` (`fetchWithRecovery` +
  `setUnauthorizedHandler`), for the app as a whole — never per-store. Auth
  endpoints (`AUTH_ENDPOINTS`) are exempt so a failed login cannot trigger a
  refresh loop.

Tests pin this seam (`docs/TESTING.md` §3/Phase 2): stubbing `globalThis.fetch`
lets every store test verify the exact method/URL/headers/body.

## Endpoints live only in `src/lib/config/apiRoutes.ts`

Every endpoint is a named route in `apiRoutes`, composed once from
`getApiUrl()` + `/api/v1`:

```ts
const BASE_URL = getApiUrl();
const API_URL = `${BASE_URL}/api/v1`;

export const apiRoutes = {
	todos: {
		list: API_URL + '/todos',
		update: API_URL + '/todos/%s',
		updateCategory: API_URL + '/todos/categories/%d',
		// …
	}
	// …
} as const;
```

- Store/service code references `apiRoutes.<domain>.<action>` — never builds a
  URL string, never hardcodes a host or path.
- `%s`/`%d` mark the id slots; the `ApiService` methods substitute them.
- The file is `as const` so route names are exact literal types.
- Storage URLs (`API_STORAGE_URL`, `API_USER_STORAGE_URL`) are exported from
  the same file.

## Pure domain services — `*Service.ts`

`src/lib/services/` splits into the **network seam** (`ApiService`) and **pure
domain services** with no I/O:

- `TodoFilterService`, `TodoSortingService`, `TodoGroupingService`,
  `TodoRelevanceService` — the todos pipeline.
- `LibraryFilterService` — search/filter for all eight library stores.
- `WealthStatisticsService` — finances graph/statistics math.
- `CalendarDragService`, `ImageService` — feature helpers (ImageService uses
  canvas; treat as environment-bound).
- `LocalStorageService` — the persistence seam (below).

Rules for a domain service:

- **One responsibility.** A service implements one family of pure
  transformations (filtering, sorting, grouping, scoring). If the name needs
  "and", split it.
- **No constructor side effects and no context reads.** Services are
  `new`-able anywhere (stores even default them as fields:
  `filterService = new TodoFilterService()`); they never call `getAuth()` or
  read `$app/*`.
- **Pure functions over plain data in, plain data out** — unit-testable in node
  with no mocks (`npm test`, see `docs/TESTING.md`). Keep types-only imports.
- Naming: `<Domain><Verb>Service.ts`. Methods read as verbs over the domain
  (`filter`, `sort`, `groupByStatus`, `getScoredTodos`).
- If you find non-trivial logic in a store or component, extract it here.

## Pure helpers — `*Helper.ts`

`src/lib/helpers/` holds small, pure, framework-free utilities, named
`*Helper.ts` and exporting plain functions:

- `DateHelper` (~34 functions: `formatDate`, `getUrlFormat`, `getCalendarMonth`, …),
  `NumberHelper`, `FormatHelper`, `ColorHelper`, `NameHelper`, `CheckInHelper`,
  `CheckInSummaryHelper`, `NavHelper`, `ClickHelper`, `ImageHelper`,
  `MusicTheoryHelper` (+ the `MusicTheory/` directory of pure modules).

Rules:

- No Svelte imports, no DOM, no `$app/*`. Pure `(input) → output` functions so
  they run in node tests.
- One concern per file. Shared helpers are imported by services, stores and
  components alike (`TodoFilterService` uses `isDateInThePast` etc. from
  `DateHelper`).
- A helper stops being a helper the moment it touches state, storage or the
  network — that belongs in a service or store.

## `src/lib/config/` — one responsibility per file

- **`platform.ts`** — the platform triplet. `PLATFORM` is `'web' | 'desktop' |
  'mobile'` from `PUBLIC_DESKTOP`/`PUBLIC_MOBILE`; `IS_WEB`/`IS_DESKTOP`/
  `IS_MOBILE`/`IS_NATIVE` derive from it. `getApiUrl()` resolves the API base:
  desktop/mobile → `getCustomApiUrl()` (from LocalStorage via
  `setCustomApiUrl`/`dropCustomApiUrl`), web → `getPwaApiUrl()` which tries,
  in order: `dev` → `http://localhost:8000`, `PUBLIC_API_URL`, then a
  hostname→API map (`app.solyto.de` → `api.solyto.de`, …) with
  `https://api.solyto.app` as the fallback.
- **`features.ts`** — feature flags (`setCustomApiUrl`, `firstStartupOptions`)
  computed from platform/environment at module load. Read these; do not add new
  ad-hoc flags to components.
- **`navigation.ts`** — the nav item registry: `NavItem` shapes, `navItems`,
  `desktopOrder`/`mobileDefaultOrder`/`mobileVisibleCount`. Syncs with
  `Navigation.svelte.ts` usage tracking.
- **`urls.ts`** — one place for every route deep-link (`urls.todos`,
  `urls.admin.users`, `getDeepLinkUrl`). Routes referenced by `goto()` or
  `<a>` come from here.
- **`themes.ts`** — the theme registry (pure data consumed by the runtime theme
  loading).

Config files are evaluated at module load; keep them import-light (they are
covered by tests mocking `$env/dynamic/public` + `$app/*`).

## `src/lib/types/` — mirror the API, one file per domain

- One file per domain mirroring the API model: `todo.ts`, `note.ts`,
  `calendar.ts`, `library_*.ts`, `clipboard.ts`, `check_in.ts`, plus auxiliary
  files (`translation.ts`, `api.ts`, `feature.ts`, `platform.ts`, …).
- Type-only imports — `import type { Todo } from '$lib/types/todo'` — keep type
  files out of the runtime graph.
- Two files carry runtime values and are the sanctioned exceptions:
  `src/lib/types/check_in.ts` (tracker/sport constants) and
  `src/lib/types/quick_add.ts` (`CONTENT_TYPE_LABELS`). Everything else in
  `types/` is erased at compile time — if you need a runtime constant, keep it
  in `config/` or in those two files, not scattered.
- Types match the API snake_case fields exactly (`due_at`, `is_completed`,
  `recurrence_frequency`).
- Domain types are used by the store, the components and the `i18n` types; do
  not duplicate a shape elsewhere.

## i18n — four locales, typed keys

`src/lib/i18n/` has exactly four translation tables — `en.ts`, `de.ts`,
`es.ts`, `fr.ts` — typed by `src/lib/types/translation.ts` (`LanguageFile`) so
a key missing from any locale (or a stray key) is a compile error.

- **All UI strings live in these files; components read them via
  `getTranslation().get` (`ts.get.<group>.<key>`)** — see the "i18n — `ts.get.*`"
  section in [`docs/COMPONENTS.md`](COMPONENTS.md).
- Every key must exist in all four locales — `npm run check` enforces it.
  When you add a string, add it to `en` first, then translate/sync the other
  three.
- `Translation.svelte.ts` owns the loaded language; `ts.loadLanguage()` is
  called at startup and `changeLanguage()` swaps the active table.
- Keys are grouped per area (`layout`, `todos`, `quick_add`, …) matching the
  interface sections in `types/translation.ts`.

## Persistence — `LocalStorageService` only

The client stores nothing but auth tokens, theme and preferences, all through
`src/lib/services/LocalStorageService.ts` (typed get/set helpers:
`getJson`, `setBool`, `getNumber`, `destroy`, …; each method guards `browser`
internally).

- No `localStorage`/`sessionStorage`/cookie access from components or stores
  directly — always via `LocalStorageService` (or `CookieConsent` state for
  cookies).
- Keys are constants next to their owner (`Todos.LS_HIDE_IT_KEY`,
  `custom_api_url` in `platform.ts`), not inline strings.
- Everything else is backend-owned; the API is the database.

## Related docs

- [`docs/AGENTS.md`](AGENTS.md) — top-level architecture summary.
- [`docs/STATE_SERVICES.md`](STATE_SERVICES.md) — the stores that consume these
  seams.
- [`docs/BEST_PRACTICES.md`](BEST_PRACTICES.md) — general in-file rules.
- [`docs/COMPONENTS.md`](COMPONENTS.md) — how components use types and i18n.
- [`docs/TESTING.md`](TESTING.md) — the coverage plan for this layer (Phase 1–2).