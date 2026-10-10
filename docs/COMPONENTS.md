# Components

Policy for the UI layer: every `.svelte` component under
`src/lib/components/**` and `src/routes/**`. Read
[`docs/BEST_PRACTICES.md`](BEST_PRACTICES.md) first; this document applies the
general rules to markup and components.

## Components are lean

A component's job is to render state and forward user intent. All logic lives
below it — in the state store or a pure service.

- Read the stores a component needs **once at the top of `<script lang="ts">`**,
  never inside the markup or per-method:

  ```ts
  const todos = getTodos();
  const loadingIndicator = getLoadingIndicator();
  const keyManager = getKeyManager();
  const ts = getTranslation();
  ```

- A component that grows a long list of `if`s and helper functions around data
  has probably swallowed store logic: move it into a method on the store or a
  service, then call it here. Components delegate; see
  [`docs/STATE_SERVICES.md`](STATE_SERVICES.md).
- Keep the `<script>` readable: store reads, `$props`, a few `$state` fields,
  event handlers, `onDestroy`. If it stops being scannable, split components.

## Type props with `$props<{...}>()`

Props are typed via the runes API. There is no `export let` anywhere in this
codebase; do not introduce it.

```ts
let { todo } = $props<{ todo: Todo }>();
```

```ts
let {
	input = $bindable(),
	value = $bindable(),
	placeholder,
	onblur,
	multiLine = false,
	height = null,
	tabindex = null
} = $props<{
	input?: HTMLInputElement | HTMLTextAreaElement | null;
	value: string;
	placeholder?: string;
	onblur?: () => void;
	oninput?: () => void;
	multiLine?: boolean;
	height?: number | null;
	tabindex?: number | null;
}>();
```

- Use `$bindable()` only for props that the parent binds (`bind:value`); plain
  props otherwise.
- Event callbacks are props typed as `() => void` / `(e: Event) => void` — pass
  them through with the `{onblur}` shorthand.
- `let { children } = $props();` accepts the default slot fragment.

## Svelte 5 syntax only

No Svelte 4 idioms. The repo has zero `on:click`, zero `createEventDispatcher`
and zero `export let` — keep it that way.

- Event attributes, not directives: `onclick`, `onkeydown`, `onblur`,
  `onmouseover` — not `on:click`.
- `{@render children?.()}` for the default slot, `{@render name()}` /
  `{#snippet name()}` for named snippets.
- Lifecycle: `onMount`, `onDestroy`, `$effect` imported from `svelte`.
- No `createEventDispatcher`: either call a store method directly or accept an
  event callback as a prop.

## Keep markup declarative — extract conditions

Markup should read top-to-bottom: `{#if}` blocks for branching, `{#each}` for
lists, `{value}` for output. Non-trivial conditions belong in a function or a
named boolean at the top of the script, not nested inline.

**Avoid** long or nested ternaries inside class attributes or other markup
expressions. Example of what not to write (found in
`src/lib/components/todos/props/Title.svelte`):

```svelte
class="{todos.view === 'list'
	? 'w-9/10'
	: 'w-3/4'} rounded-lg border-1 border-c-neutral-2 text-sm …"
```

When a class or expression depends on more than a trivially-invertible fact,
compute it in the script and reference the name:

```ts
let inputWidth = $state('w-3/4');
// derived from todos.view in a method, or:
function inputClass(): string {
	return todos.view === 'list' ? 'w-9/10' : 'w-3/4';
}
```

Same rule for `{#if}`: a `{#if}` whose condition spans several `&&`/`||` or
requires a nest of conditions should become a named boolean or an extracted
render-block function. Prefer the guard-clause style from
[`BEST_PRACTICES.md`](BEST_PRACTICES.md#early-returns--no-nested-short-ifs)
where possible.

## Prefer the shared primitives

Check `src/lib/components/ui/` (buttons, modals, badges, cards, navbars) and
`src/lib/components/forms/` (`TextInput`, `Checkbox`, `Toggle`, `Select`,
`Slider`, `DateInput`, …) before hand-rolling a control.

- Reuse the existing primitives for inputs, modals, buttons and confirmation
  dialogs. A hand-rolled text input with different classes than `TextInput` is
  a smell.
- Modal/confirm flows use the shared `Modal` primitives —
  `ui/ConfirmationModal`, `ui/ContentModal`, `BottomSheetModal` for mobile.
- When a primitive genuinely misses a feature, extend the shared one rather
  than forking it per-feature.

## The desktop/mobile split

Several features keep separate view variants driven by `Viewpoint`:

- `todos/views/{ListView,CardView,OverviewView,KanbanView}` and
  `todos/TodoNavigationMobile`, `todos/views/ViewSwitcher`.
- `calendars/views/{day,week,month,list}`, plus `views/{day,week,month}/Mobile*View`.
- Components that switch on screen class read the store once:
  `const viewPoint = getViewPoint();` then branch on `viewPoint.isDesktop` /
  `viewPoint.isMobile` in the markup.
- Name mobile variants consistently: `*Mobile.svelte` or `Mobile*View.svelte`,
  living next to the desktop component they pair with.

## Tailwind conventions

Styling is Tailwind CSS v4 utility classes, theme tokens from the runtime theme
CSS, and dark-mode variants.

- Use the `c-*` theme tokens for colours (`bg-c-bg`, `text-c-btn`,
  `border-c-neutral-2`, `text-c-danger`, `focus:ring-c-primary`) and `s-dark-*`
  tokens for dark surfaces (`dark:bg-s-dark-3`). Do not hardcode hex colours in
  components.
- Add `dark:` variants where the component needs different colours in dark
  mode.
- Class order is managed by `prettier-plugin-tailwindcss` — write classes and
  let `npm run format`/the formatter sort them.
- Use `size-*` utilities for component sizing (`size-6`, `size-4`) instead of
  mixing `w-`/`h-` where a square is meant.
- Conditional classes via the `class:` directive
  (`class:pt-6={IS_DESKTOP}`) — it composes with plain `class="…"`.
- Utility values that repeat across the app (like the input styling on
  `TextInput`) stay in the shared component, not re-pasted.

## Icons

Icons come from `@lucide/svelte`, imported per-icon from
`@lucide/svelte/icons/<kebab-case-name>`:

```ts
import IconLoaderCircle from '@lucide/svelte/icons/loader-circle';
```

```svelte
<IconLoaderCircle class="size-6 animate-spin text-c-btn" />
```

No hand-drawn SVGs inline, no icon-font classes; the lucide set is the icon
library.

## i18n — `ts.get.*`

Every user-facing string comes from the translation store:
`const ts = getTranslation();` then `ts.get.layout.save`, or
`ts.get.quick_add.commit_success.replace('%s', destination)`.

- Never hardcode a UI string in a component. `{ts.get.layout.double_click_to_edit}`
  is the pattern (`Title.svelte`).
- All four locale files (`src/lib/i18n/{en,de,es,fr}.ts`) must stay in sync —
  `npm run check` enforces it (`docs/AGENTS.md` hard rule).
- Use `%s`/`%d` placeholders in a translation string and `.replace(...)` at the
  call site when a value is interpolated.
- Translation keys are typed via `src/lib/types/translation.ts`; an invalid key
  is a compile error.

## Local UI state via `$state`

Component-local, ephemeral state (an open modal, an edit flag, a hover box
position) is a `$state` field — not a store, not a `$derived`-spam:

```ts
let changeTitle = $state<boolean>(false);
let titleInput = $state<HTMLInputElement | null>(null);
let explanationBoxX = $state<number>(0);
```

- UI-only state stays in the component; anything the route, another component
  or the backend cares about belongs on a store.
- `$derived` only for genuine template-read derivations
  ([`BEST_PRACTICES.md`](BEST_PRACTICES.md#derived-discipline)).

## Loading feedback

Wrap store operations in the shared indicator:

```ts
loadingIndicator.start();
await todos.changeTitle(todo, todoTitle);
loadingIndicator.stop();
```

- `getLoadingIndicator()` returns the shared `LoadingIndicator` store; its
  `start()`/`stop()` power the global `ui/LoadingIndicator` overlay.
- Always `start()` before the await and `stop()` on every exit path. Prefer
  `if (!res) return;`-style early returns with a `stop()` before them, or a
  `try/finally`, so the spinner can never stay up.

## Keyboard handling via `KeyManager`

Global keyboard shortcuts use the `KeyManager` store, registered per component
and cleaned up in `onDestroy`. The pattern from
`src/lib/components/todos/props/Title.svelte`:

```ts
keyHandlers.Enter = keyManager.registerKeyDown('Enter', handleEnter);
keyHandlers.Escape = keyManager.registerKeyDown('Escape', handleEscape);

onDestroy(() => keyManager.unregisterAll(keyHandlers));
```

- `registerKeyDown(key, handler)` returns an id; keep it in a local object so
  `unregisterAll(handlers)` can release everything at once, including on blur.
- Never register a handler without registering its inverse for the component's
  lifetime — an orphaned global handler leaks across routes.
- Plain DOM-level keys (an input's own `onkeydown`) do not need `KeyManager`;
  it exists for app-wide/global shortcuts and per-edit-mode hijacks.

## Accessibility

`svelte-check` is configured to ignore two a11y warnings:
`a11y_click_events_have_key_events` and `a11y_no_static_element_interactions`
(see the `check` script in `package.json`). That ignore is intentional, but the
responsibility it waives is not: **any clickable non-native element must still
be made reachable by keyboard.**

- A clickable `<span>`/`<div>` needs `role="button"` and `tabindex="0"`, and
  either an `onkeydown` doppelgänger or a `KeyManager` registration for Enter.
  (`Title.svelte` uses `role="button" tabindex="0"` for its double-click
  target; double-click itself has no keyboard equivalent, which is why the
  accompanying hover box is not the only affordance.)
- Prefer native elements (`<button>`, `<a href>`) whenever the interaction is a
  real click — they get focus, keyboard and semantics for free.
- Keep focus styles visible (`focus:ring-2 focus:ring-d-lightblue` on inputs,
  and `focus:outline-none` only where a ring replaces the outline).

## Testability

The cleanest test targets are props-driven leaves: components that take data
and callbacks as props and render them (dashboard widgets, `forms/Slider`,
badges/counters). They need no context seeding and are covered by
`docs/TESTING.md` §4a/§8's "Priority 2". Components that pull stores via
`getX()` but carry real logic (keyboard handling, selection, filtering UI) are
testable through the context harness described in `docs/TESTING.md` §4.3.

When writing a new component, favour making it easy to test: accept data via
props and delegate mutations to the store either way. Render-only markup
(simple icons, dividers, static labels) does not need tests and should not get
them.

## Related docs

- [`docs/BEST_PRACTICES.md`](BEST_PRACTICES.md) — general rules (readability,
  naming, comments, `$derived`).
- [`docs/STATE_SERVICES.md`](STATE_SERVICES.md) — the stores components read.
- [`docs/DATA_LAYER.md`](DATA_LAYER.md) — types and i18n used in props/markup.
- [`docs/TESTING.md`](TESTING.md) §4, §8 — component test strategy.