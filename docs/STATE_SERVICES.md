# State services

Policy for the state layer: `src/lib/state/*.svelte.ts`. These are the
Svelte 5 runes classes that hold each domain's reactive state and own its
communication with the API. Read
[`docs/BEST_PRACTICES.md`](BEST_PRACTICES.md) first; this
document applies those general rules to this layer.

## One class per domain, one file per domain

- One exported class per domain (`Todos`, `Clipboard`, `QuickAdd`, `Auth`, …),
  in one file named after it (`Todos.svelte.ts`).
- `.svelte.ts` extension is required — it is what makes the runes (`$state`)
  compile.
- The class is the domain's single source of truth: it holds the data, exposes
  the methods that change it, and is the only layer that talks to
  `ApiService`. Components read it, they do not re-implement it.
- No markup, no DOM, no UI strings inside the class (those belong to
  components and `i18n/`).

## The context-singleton pattern

Every store is a Svelte context singleton. The file exports a private `Symbol`
key plus a `setX()` / `getX()` pair — the only sanctioned shape:

```ts
const CLIPBOARD_KEY = Symbol('SOLYTO_CLIPBOARD');

export function setClipboard(): Clipboard {
	return setContext(CLIPBOARD_KEY, new Clipboard());
}

export function getClipboard(): Clipboard {
	return getContext<Clipboard>(CLIPBOARD_KEY);
}
```

- `setX()` is called **once**, during component initialisation, and returns the
  new instance.
- `getX()` is called by any component below that needs the store. It never
  constructs — a missing provider is a programming error, not a case to handle.
- App-wide stores (`Auth`, `Translation`, `Viewpoint`, `KeyManager`,
  `LoadingIndicator`, `UiNotifications`, `Navigation`, `CookieConsent`,
  `PwaInstall`, `WelcomeTour`, `QuickAdd`) are created in
  `src/routes/+layout.svelte`.
- Feature stores are created in the feature's route layout — e.g.
  `setTodos()`/`setTags()` in `src/routes/todos/+layout.svelte`,
  `setClipboard()` in `src/routes/clipboard/+layout.svelte`,
  `setBookLibrary()` in `src/routes/libraries/books/+layout.svelte`. This keeps
  a feature's store alive only while its routes are mounted.

## Reactive state as `$state` class fields

- Declare each piece of reactive state as a public `$state` field with an
  explicit type:

  ```ts
  loaded = $state<boolean>(false);
  todos = $state<Todo[]>([]);
  activeWorkspace = $state<TodoWorkspace | null>(null);
  view = $state<'list' | 'kanban' | 'overview' | 'card'>('list');
  ```

- Initialise to the empty/neutral value so the store is valid before `load()`
  runs.
- Mutate the field directly (`this.todos = res.data as Todo[]`); do not wrap it
  in setters, stores or extra indirection. Svelte's runes propagate the change.
- Internal-only state may be `private` (see `Viewpoint._state`), but reach for
  that only when you also want to expose a stable read-only surface (next
  section).

## Member ordering

Keep the same order in every store, top to bottom. `Todos` is the reference:

1. `static readonly` constants (`Todos.LS_HIDE_IT_KEY`).
2. `$state` fields.
3. Collaborators/dependencies declared as typed fields (`auth`, `apiService`,
   `localStorage`, injected services) and any private helpers.
4. The constructor.
5. Public methods.
6. `private` methods last.

The `Symbol` key and `setX()`/`getX()` functions live **below** the class, at
the bottom of the file.

## Constructor dependency injection (preferred)

The preferred shape injects collaborators through constructor parameters whose
defaults preserve zero-argument construction. `Todos` and `Finances` are the
reference:

```ts
export class Todos {
	auth: Auth;
	apiService: ApiService;
	localStorage: LocalStorageService;

	constructor(
		auth: Auth = getAuth(),
		apiService: ApiService = auth.apiService,
		localStorage: LocalStorageService = new LocalStorageService()
	) {
		this.auth = auth;
		this.apiService = apiService;
		this.localStorage = localStorage;
	}
}
```

```ts
export class Finances {
	auth: Auth;
	apiService: ApiService;

	constructor(auth: Auth = getAuth(), apiService: ApiService = auth.apiService) {
		this.auth = auth;
		this.apiService = apiService;
		// …
	}
}
```

Why it matters:

- `new Todos()` still works everywhere (the defaults do the context lookup), so
  the change is invisible to callers.
- Tests can pass mocks (`new Todos(mockAuth, mockApi, mockStorage)`) without
  module-level `vi.mock` gymnastics — this is the refactor `docs/TESTING.md` §4
  describes, and it is what made the store tests possible.
- The defaults are the single place that knows how to build the real
  collaborators.

The **older style** some stores still use declares dependencies as
field initialisers, which run before the constructor body:

```ts
// older — not the target style
export class Clipboard {
	auth = getAuth();
	apiService: ApiService;

	constructor() {
		this.apiService = this.auth.apiService;
	}
}
```

This works, but it cannot be overridden by a constructor argument and forces
tests to mock the `Auth` module. When you touch a store, prefer migrating it to
the injectable shape; do not do it as a bulk rewrite.

The shared API client is `auth.apiService` — `Auth` owns one `ApiService`
instance and keeps its token current (`updateAuthToken`). Stores default to it;
do not construct a second `ApiService` with a hand-copied token.

## The `load()` + `loaded` convention

Every domain store exposes an async `load(): Promise<void>` that fetches its
data and populates the `$state` fields, and a boolean `loaded` field set to
`true` on the first successful load. Components/layouts call `load()` in
`onMount` and use `loaded` to avoid rendering empty state.

```ts
async load(): Promise<void> {
	const res = await this.apiService.list(apiRoutes.todos.list);

	if (res) {
		this.loaded = true;
		this.todos = res.data as Todo[];
		this.filteredTodos = this.todos;
		// …
	}

	// … derived steps, then parallel sub-loads
}
```

- One `if (res)` block does the assignment; failure simply leaves the previous
  state in place (see error semantics in [`DATA_LAYER.md`](DATA_LAYER.md)).
- Sub-loads use their own `loadX()` methods and may run in parallel via
  `Promise.all`.
- `load()` re-derives everything that depends on the freshly-loaded data, so a
  store is never left half-updated.

## The CRUD method pattern

Every create/update/delete method follows the same shape: call `ApiService`
with a route from `apiRoutes`, reload on success, return a boolean.

```ts
async delete(todo: Todo): Promise<boolean> {
	const ok = await this.apiService.delete(apiRoutes.todos.delete, todo.id);
	if (ok) await this.load();
	return ok;
}
```

```ts
async addTag(todo: Todo, tagId: number): Promise<boolean> {
	const tagIds = todo.tags.map((t) => t.id);
	const request: UpdateTodoRequest = { tags: tagIds.concat([tagId]) };
	const res = await this.apiService.update(apiRoutes.todos.update, todo.id, request);
	if (res) await this.load();
	return res;
}
```

- Build a typed request object first (`const request: UpdateTodoRequest = {…}`),
  then pass it to `ApiService`.
- Return `true`/`false` (or the raw `res`/`ok`) so the calling component can
  react. Mutating methods that need a created entity return it (or `null`).
- **This repetitiveness is intentional.** It is not something to "DRY up" behind
  a generic `crud(endpoint, method, id)` helper — each method is a greppable,
  independently-readable contract with its own request type, and the
  boilerplate CRUD wrappers are explicitly excluded from test coverage
  (`docs/TESTING.md` §8). Copy the nearest method; do not abstract it.

## Delegate pure logic to `services/`

A store is glue: it holds state and sequences API/pure calls. Filtering,
sorting, grouping and scoring are pure and live in `src/lib/services/`:

- `Todos` delegates to `TodoFilterService`, `TodoSortingService`,
  `TodoGroupingService` and `TodoRelevanceService` — e.g.
  `this.filteredTodos = this.filterService.filter(filter, this.filteredTodos)`.
- The service instances are held as fields (`filterService = new TodoFilterService()`)
  and called from the store's methods.
- Library stores hold a `LibraryFilterService`; `Finances` uses
  `WealthStatisticsService`.

If you are about to write a non-trivial `filter`/`map`/`reduce` chain inside a
store method, stop: it probably belongs in a `*Service.ts` where it can be unit
tested without any Svelte context. See [`DATA_LAYER.md`](DATA_LAYER.md).

## Persistence

The only client-side persistence is `LocalStorageService`, injected into the
store. Storage keys are class constants named `LS_*`:

```ts
export class Todos {
	static readonly LS_HIDE_IT_KEY: string = 'todos_hideit';
	// …
}
```

```ts
this.hideItActive = this.localStorage.getBool(Todos.LS_HIDE_IT_KEY) ?? false;
```

- Always go through `LocalStorageService` — it guards `browser` internally, so
  callers do not have to.
- Keys are `snake_case` strings (`'todos_hideit'`, `'custom_api_url'`).
- Restore persisted state in the constructor, and re-read it in `load()` when a
  value could have changed while the initial load was in flight (see
  `Todos.loadHideIt()`). Auth tokens are the one exception handled by `Auth`
  itself.

## Browser and route imports — guard them

- `browser` from `$app/environment` guards anything that touches `window`,
  `document` or `localStorage`. `LocalStorageService` does this internally; a
  store that touches the DOM directly must do the same. `Viewpoint` guards its
  entire initialisation behind `if (browser)`.
- `page` from `$app/state` is read for route information (e.g.
  `page.url.searchParams` in `Todos.checkUrlForFilter()`). Read it; do not
  subscribe to navigation inside the store.
- If a store registers listeners or timers, clean them up in an explicit
  `destroy()` method and call it from the owner component's `onDestroy`.
  `Viewpoint` collects each cleanup closure in an array and runs them all in
  `destroy()`.

## Stores may depend on other stores

A store may read another store or the translation table when its logic needs
them:

- `QuickAdd` reads `getTranslation()` and `getUiNotifications()` for its error
  messages, and `getAuth()` for the API client.
- `Translation` reads `getAuth()` to pick the user's language.

Resolve these dependencies once in the constructor (or as defaults), not on
every method call, and never create a cycle. Keep the dependency in the
constructor's parameter list where practical so tests can inject it
(`docs/TESTING.md` §4 gives `QuickAdd` as the `ts`/`notifications` example).

## Read-only view state via getters

When a store owns computed state that consumers must not write, expose it
through getters. `Viewpoint` keeps its data in a `private _state` and returns
`get state()`, `get width()`, `get isDesktop()`, etc.:

```ts
private _state = $state<ViewPointState>({ width: 0, height: 0, isDesktop: false, isMobile: true, isTablet: false });

get isDesktop() {
	return this._state.isDesktop;
}
```

Use this for genuinely read-only derivations (screen class, computed URL
flags). For normal domain data, keep the public `$state` field — getters for
everything add noise.

## What not to do

- **No markup, DOM, or UI strings** in a store. That is the component layer's
  job.
- **No hardcoded API URLs.** Every endpoint comes from
  `src/lib/config/apiRoutes.ts`; never build a URL string by hand.
- **No inline `fetch`.** `ApiService` is the single network seam; a store calls
  it and nothing else. (The only exceptions are the few legacy direct-`fetch`
  methods in `Calendars` — do not copy them.)
- **No giant methods.** Split by named steps (`loadCategories`, `useFilters`).
- **No new global singletons.** Use the context pattern; do not export a
  module-level `new Todos()`.
- **No `$derived` dumping ground.** Derived values that belong in a method or a
  service stay there; see [`BEST_PRACTICES.md`](BEST_PRACTICES.md#derived-discipline).
- Do not add an abstraction a store does not already use.

## Related docs

- [`docs/BEST_PRACTICES.md`](BEST_PRACTICES.md) — general in-file rules.
- [`docs/DATA_LAYER.md`](DATA_LAYER.md) — `ApiService`, `apiRoutes`, services,
  helpers, types, i18n.
- [`docs/COMPONENTS.md`](COMPONENTS.md) — how components read these stores.
- [`docs/TESTING.md`](TESTING.md) §3–4 — the store test recipe and the
  constructor-injection refactor.
