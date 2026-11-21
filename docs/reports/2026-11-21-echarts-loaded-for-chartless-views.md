# Report: time tracking and budgets load all of echarts for views that show no chart
read: false

Date: 2026-11-21
Scope: how the chart components in `src/lib/components/charts/` pull echarts into
route chunks, and which routes pay for it.
Method: `npm run build` at `fe7bc70`. I mapped route nodes to chunks with the
`__vite__mapDeps` table in `entry/app.*.js` and the server `manifest.js`, then read
the routes. No code was changed. Load times were not measured on a device. Sizes
come from the build output; the user-facing effect is **inferred**.

**Overall: a performance fix for `/time-tracking` and `/finances/budget`.** Both
routes statically import the echarts chunk, the largest JS chunk in the build. On
their default views neither one renders a chart.

---

## 1. Finding: the echarts chunk is a static dependency of six routes (verified)

The chart components import `init` from `charts/echarts.ts` at module level.
`echarts.ts` runs `use([...])` as soon as it's evaluated. Any route that imports a
chart component therefore downloads, parses and evaluates echarts + zrender
**before the route renders**, whether or not a chart is ever shown.

Build output (client):

| chunk | raw | gzip | contents |
|---|---|---|---|
| `chunks/BG2foI6z.js` | 559 kB | 186 kB | echarts core + zrender + the registered charts |
| `nodes/70.*.js` (`/time-tracking`) | 15 kB | 5 kB | the route itself |
| `nodes/47.*.js` (`/finances/budget`) | 11 kB | 4 kB | the route itself |

Routes whose preload list includes the echarts chunk: `/admin/users`,
`/check-in/trends`, `/finances`, `/finances/budget`, `/finances/wealth` and
`/time-tracking`.

The chunk is already tree-shaken (`echarts.ts` registers only Bar/Line/Pie). What's
left to fix is *when* it loads, not what it contains.

## 2. Where it's wasted (verified)

- **`/time-tracking`** (`src/routes/time-tracking/+page.svelte`): three tabs. The
  default `dashboard` tab and the `entries` tab have no charts. Only `StatisticsView`
  (`?tab=statistics`) imports `DoughnutChart` and `BarChart`. Because
  `StatisticsView` is imported statically, the default view waits for a chunk
  roughly 37× the size of the page's own code. This is also where the nav link and
  `WidgetBridge` (`goto(urls.timeTracking)`) send the user.
- **`/finances/budget`** (`src/routes/finances/budget/+page.svelte`): the only chart
  is the `SmoothLineChart` inside `FinanceHistory`, which renders only under
  `{#if historyBudget}`, i.e. after the user opens a budget's history.

On `/finances`, `/finances/wealth`, `/check-in/trends` and `/admin/users` the charts
are the main content, so loading echarts there is expected (see 4).

## 3. Cost (inferred)

- **First web visit / no service worker yet:** +186 kB gzip on the critical path of
  the default time-tracking and budget views. `data-sveltekit-preload-data="hover"`
  (`app.html`) hides part of this on desktop. Touch devices get no hover, so on
  mobile it's paid in full on tap.
- **Installed PWA:** `service-worker.ts` precaches all of `build`, so the download is
  paid once at install. Every visit still parses and evaluates 559 kB of JS before
  the route mounts. On a mid-range phone that's tens to a few hundred ms of main
  thread time. The figure is an estimate: not measured.

## 4. Suggested fix

**Option A: lazy `init` inside the four chart components (recommended).** Keep the
static imports of the `.svelte` chart components. Replace the module-level
`import { init } from './echarts'` with a dynamic import at chart creation:

```ts
async function createChart() {
	if (!chartContainer || !values?.length) return;
	const { init } = await import('./echarts');
	if (destroyed || !chartContainer) return; // component may be gone by now
	...
}
```

Keep `import type { ECharts } from './echarts'`, since type imports are erased. This
fixes every route at once with no route changes. Echarts then loads only when a chart
actually mounts (the statistics tab, the history modal). On the four chart-first
routes the page shell and data render first and the chart fills in right after, with
no extra round trip in the PWA because the chunk is precached.

Things to watch:
- `createChart` becomes async. It's called from `onMount` → `tick()`, from an
  `$effect` and from the data-update paths. Each component needs a `destroyed` flag
  (or a check that `myChart` / `chartContainer` still exists) after the `await`.
  Otherwise a chart can be `init`ed on a detached node after `onDestroy` has already
  run `dispose()`.
- Two overlapping calls (initial mount + quick data change) must not both `init` on
  the same container. The existing `myChart.dispose()` at the top of `createChart`
  must run *after* the `await`, not before it.

**Option B: lazy-load the two views at route level.** Use
`{#await import('$lib/components/time-tracking/StatisticsView.svelte')}` in the
time-tracking route and the same for `FinanceHistory` in the budget route. This is a
smaller change but fixes only these two routes, and every new chart-bearing view has
to remember the pattern. A is preferable because the fix lives in one place.

## 5. How to verify

- `npm run build`, then check that `nodes/70.*` and `nodes/47.*` no longer list the
  echarts chunk in `entry/app.*.js`'s `__vite__mapDeps`.
- DevTools Network on `/time-tracking`: the echarts chunk must not load until
  `?tab=statistics` is opened.
- Manually: switch quickly between time-tracking tabs and open/close a budget
  history. There should be no console errors and no chart drawn into a closed modal.
- The chart components have no tests (`docs/TESTING.md`: not markup). If the
  destroyed-guard is factored out, it could be covered by a component test in
  `tests/components/`.

## Notes

- The full `npm run build` hit a Node heap OOM in the adapter-node step in this
  sandbox (about 1 GB heap). The Vite client/server builds had already completed, and
  all numbers above come from that client output. The OOM is an environment issue
  and may be worth a look if CI runs with a similarly small heap.
- Side observation, not a vulnerability: `QuoteDetail.svelte:35-36` renders
  `entry.source` as a link guarded by `startsWith('http')` instead of `safeHref()`,
  which every other user-supplied link uses. `startsWith('http')` already blocks
  `javascript:`, so this is only a consistency issue.
