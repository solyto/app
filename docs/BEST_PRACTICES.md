# solyto coding policies

General, cross-cutting rules for writing code in the solyto frontend. Every
other policy document assumes these rules; this file is the entry point to the
set.

## Purpose and how to use this set

The solyto frontend is one SvelteKit 2 / Svelte 5 app maintained by a small
number of people, most of it written by hand in a consistent style. These
documents capture that style so new code — whether written by a person or by an
AI assistant — reads like the rest of the codebase instead of like a generic
Svelte tutorial.

There are four policy documents, each owning one layer:

| Document                                       | Owns                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| **`docs/BEST_PRACTICES.md`** (this file)       | General in-file rules that apply everywhere                                 |
| [`docs/STATE_SERVICES.md`](STATE_SERVICES.md)  | The state layer: `src/lib/state/*.svelte.ts`                                 |
| [`docs/COMPONENTS.md`](COMPONENTS.md)          | The UI layer: `src/lib/components/**` and `src/routes/**` `.svelte` files    |
| [`docs/DATA_LAYER.md`](DATA_LAYER.md)          | `services/`, `helpers/`, `config/`, `types/`, `i18n/` and the data flow      |

`docs/TESTING.md` is the companion testing policy and is referenced from the
"Testing" section below rather than duplicated here. `docs/AGENTS.md` remains
the top-level architecture summary.

**How to use it:** read this file first, then jump to the document for the
layer you are touching. Every rule is grounded in a real file in this repo —
when in doubt, open the cited file and copy its shape. If a rule and the
existing code disagree, the rule is wrong; fix the rule.

## Readability first

The top rule, and the reason the others exist: code is read far more often than
it is written. Optimise for the next person reading it, not for the fewest
lines or the cleverest expression.

- Prefer an obvious implementation over a compact one. A five-line function
  with clear names beats a one-line chain of `reduce`/ternaries.
- Match the surrounding file. The codebase has an established shape for stores,
  components, services and config — imitate the nearest example instead of
  inventing a new pattern.
- A reader should be able to follow a function top to bottom without jumping
  around to understand control flow.

This trade-off is deliberate: the repo accepts some repetition (see
[`STATE_SERVICES.md`](STATE_SERVICES.md#the-crud-method-pattern)) in exchange
for predictable, greppable, obvious code.

## DRY — but not prematurely

Duplication is a smell, but a premature abstraction is worse: it hides two
slightly-different things behind one helper and makes both harder to change.
`docs/AGENTS.md` states the hard rule directly:

> Do not add abstractions not already present in the codebase.

- Extract a helper when the same logic appears **three or more times** and the
  cases genuinely do the same thing. Two similar-looking blocks are allowed to
  stay separate.
- Do not introduce base classes, generics, factories, or "flexible" options
  objects the codebase does not already use.
- When logic is shared, put it in a named, single-purpose module
  (`src/lib/helpers/*Helper.ts` for pure utilities, `src/lib/services/*Service.ts`
  for domain logic) — not in a god-object or inline in a component.
- Repetition that mirrors an external contract (e.g. the CRUD methods in the
  state layer) is intentional and should be left alone.

If you cannot point at an existing pattern for the abstraction you are about to
add, do not add it.

## Small, single-purpose functions

A function should do one thing and its name should say what that is.

- Keep functions short enough to read without scrolling. If a function has
  several distinct phases, each phase is usually its own function.
- No side effects hidden behind an innocuous name. A function called
  `getScoredTodos` returns scored todos; it does not also mutate storage.
- Split a long method by extracting named steps. In `Todos.svelte.ts`, `load()`
  reads as a sequence of named operations — `loadCategories()`,
  `loadWorkspaces()`, `loadHideIt()`, `groupByStatus()` — rather than one long
  body.
- Pure logic belongs in `services/`/`helpers/`, not mixed into UI or state
  glue. `Todos` delegates filtering, sorting and grouping to
  `TodoFilterService`, `TodoSortingService` and `TodoGroupingService`.

## Early returns — no nested short-ifs

Guard clauses are the default. Handle the exceptional or terminal cases first
and return, so the rest of the function stays at one level of nesting.

**Do not** wrap a whole function body in an `if` when the inverted condition
lets you return early, and **do not** write `else` after a branch that already
returns.

```ts
// preferred — flat, each guard on its own line
function label(todo: Todo): string {
	if (todo.is_completed) return 'done';
	if (todo.status === 'backlog') return 'backlog';
	return 'open';
}

// avoid — inverted condition nested over the whole body
function label(todo: Todo): string {
	if (!todo.is_completed) {
		if (todo.status !== 'backlog') {
			return 'open';
		}
		return 'backlog';
	}
	return 'done';
}
```

Real examples: `Todos.loadHideIt()`, `QuickAdd.detect()`/`confirm()`, and
`Viewpoint`'s `if (browser)` guard all bail out early instead of nesting the
main path. One-line guards with a bare `return` (`if (!res) return;`) are
preferred over a nested `else`.

This is a readability rule, not an anti-`if` rule: a single, shallow `if/else`
with balanced branches is fine. The thing to avoid is a ladder of nested
`if/else` and short ternaries that force the reader to hold several conditions
in their head at once.

## Naming

Names carry the structure of the code; be consistent with the existing ones.

- **Booleans** read as assertions: `loaded`, `isDesktop`, `isMobile`,
  `hideItActive`, `sortByScore`, `todosScored`, `needsConfirmation`. Prefix
  with `is`/`has`/`should` when the bare noun is ambiguous.
- **Handlers** in components: `onclick`-style attributes reference a function
  whose name describes the action — `toggleChangeTitle`, `setExplanationBoxPosition`,
  or the conventional `handleEnter`/`handleEscape`. Form callbacks use the
  short `onsubmit`/`onblur`/`oninput` when they mirror the DOM event.
- **State classes** are nouns (`Todos`, `Clipboard`, `QuickAdd`); their context
  accessors are `setX()` / `getX()` (see
  [`STATE_SERVICES.md`](STATE_SERVICES.md#the-context-singleton-pattern)).
- **Methods** are verbs: `load`, `useFilters`, `groupByStatus`, `toggleHideIt`.
  Getters that expose derived read-only values are named after the value
  (`isUrl`, `isDesktop`).
- **Constants** are `UPPER_SNAKE_CASE` and scoped to the class that owns them:
  `Todos.LS_HIDE_IT_KEY`, `TODOS_KEY`. Storage keys always start with `LS_`.
- Files map to the class: `Todos.svelte.ts`, `ApiService.ts`, `TodoFilterService.ts`.

## Comments explain why, not what

The code says what it does; a comment earns its place by explaining **why** —
the non-obvious constraint, the reason for the awkward-looking order, the bug
being avoided.

`Todos.svelte.ts` is the reference:

```ts
// Restore synchronously so every filter pass (including the ones run by
// load() before the workspaces request resolves) already sees the
// persisted value instead of the default false.
this.hideItActive = this.localStorage.getBool(Todos.LS_HIDE_IT_KEY) ?? false;
```

```ts
// Always re-apply hide-it once the parallel loads settled: a failed
// or rejected workspaces/categories request must not skip this.
```

`Viewpoint.svelte.ts` shows the complementary case: the non-obvious constraint
is that browser APIs only exist in the browser, so the constructor guards the
whole initialisation behind `if (browser)`.

- Do **not** narrate the obvious (`// increment i`).
- Do **not** leave commented-out code; git remembers it.
- Prefer a short block comment above a tricky block over line-by-line comments
  inside it.

## `$derived` discipline

Use `$derived` only for a genuine derivation of other reactive state that is
read while rendering. It is not a place to stash transformations that belong in
a function, a service, or a `$state` field set by a method.

The legitimate use is `src/routes/+layout.svelte`:

```ts
const canAccessRoute = $derived(auth.loggedIn || isAuthRoute() || isSetupRoute());
```

`canAccessRoute` is a pure function of existing state and is consumed in the
template, so it stays correct automatically.

- Deriving from one or two reactive reads with no side effects: fine.
- Hiding a chain of `.filter().map().sort()` behind `$derived`: move it into a
  method or service (`Todos.useFilters` is a method, not a `$derived`).
- A value that is recomputed by an explicit method (e.g. `filteredTodos` after
  a filter change or a reload): keep it as `$state` and assign it in the
  method, so writes go through one place and stay debuggable.
- Do not use `$derived` to avoid thinking about when a value changes.

## TypeScript

The project is TypeScript strict (`tsconfig.json` sets `"strict": true`).

- Type everything real. Prefer explicit types on public method parameters and
  return values in the state and service layers.
- Use `import type { ... }` for types — it keeps the import out of the runtime
  graph and is enforced by tooling. Types-only files under `src/lib/types/` are
  erased at compile time; the only two with runtime values are
  `src/lib/types/check_in.ts` and `src/lib/types/quick_add.ts`.
- Avoid `any`. If an API payload genuinely has no shape yet, cast through the
  domain type at the boundary (`res.data as Todo[]`) rather than leaking `any`
  through the codebase.
- Model unions as string-literal unions (`'list' | 'kanban' | 'overview' |
  'card'`) instead of loose `string`, and keep them next to the state they
  describe.
- Run `npm run check` (svelte-check) before considering a change done.

## Formatting and tooling

Formatting is not a matter of taste here — it is fixed by `.prettierrc` and
enforced by `npm run lint`.

- **Indentation:** tabs (`useTabs: true`), 4-wide.
- **Quotes:** single quotes.
- **Line width:** 100 characters.
- **Trailing commas:** none.
- **Plugins:** `prettier-plugin-svelte` (Svelte markup) and
  `prettier-plugin-tailwindcss` (stable ordering of Tailwind classes).
- `npm run format` rewrites files; do not hand-fight the formatter. Never
  hand-edit generated output (`build/`, `.svelte-kit/`).
- ESLint (`eslint.config.js`) layers `typescript-eslint` and
  `eslint-plugin-svelte` on top of Prettier. `npm run lint` runs both
  `prettier --check .` and `eslint .`.
- `npm run check` is the type gate; treat it as part of "done", not optional.

## Testing

Keep this short and defer to the full plan in [`docs/TESTING.md`](TESTING.md).
The one rule to remember:

> Test logic and contracts, not markup, and not third-party internals.

- Pure helpers, services and config get unit tests in node (`npm test`).
- State stores are tested through their public methods with `ApiService`,
  `Auth` and `LocalStorageService` mocked or injected — never by reaching into
  private fields.
- Presentational components are tested only when they carry logic (keyboard
  handling, selection, props-driven data). Render-only icons, logos and
  dividers are not worth a test.
- Do not assert on ECharts/TipTap/DnD internals; assert our props and logic.
- Follow the existing store-mock recipe and context harness described in
  `docs/TESTING.md` §4.

## Related docs

- [`docs/AGENTS.md`](AGENTS.md) — what the app is and how it is structured.
- [`docs/STATE_SERVICES.md`](STATE_SERVICES.md) — the state-service layer.
- [`docs/COMPONENTS.md`](COMPONENTS.md) — the component and route layer.
- [`docs/DATA_LAYER.md`](DATA_LAYER.md) — services, helpers, config, types, i18n.
- [`docs/TESTING.md`](TESTING.md) — the full test coverage plan.
