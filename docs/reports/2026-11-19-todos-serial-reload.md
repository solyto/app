# Report: every todo click waits for three requests in a row (five on a Kanban drag)

Date: 2026-11-19
Scope: `load()` in `src/lib/state/Todos.svelte.ts` and its callers
(`src/routes/+page.svelte`, `src/routes/todos/+page.svelte`,
`src/lib/components/todos/views/KanbanView.svelte`).
Method: read the code at `10a9c14`, then checked the request order and the
visible list with a throwaway Vitest store test (mocked `ApiService` with deferred
responses). The test was not committed. No code was changed. Nothing was measured
against a real API or in a browser.

**Overall: a clear latency win on the most-used feature, and the fix also removes a
flash of hidden todos.** This is the same serial pattern the owner already approved
fixing for the libraries (`library-reload-after-edit`, job `violent`). The library
report named `Todos` as the example that is already parallel. That is only half
true: categories and workspaces load in parallel with each other, but not with the
todo list.

---

## 1. Finding: `load()` is two round trips, and every edit calls it (verified)

`Todos.svelte.ts:85-108`:

```ts
const res = await this.apiService.list(apiRoutes.todos.list);   // RTT 1
...
await Promise.all([this.loadCategories(), this.loadWorkspaces()]); // RTT 2
```

Neither categories nor workspaces depend on the todo list. The probe test confirms
it: while the list request is pending, it is the only request in flight; categories
and workspaces start only after it resolves.

The store keeps the full reload after each edit on purpose, and that stays as it is.
But all 20 `await this.load()` call sites in the store (`changeCompleted`,
`changeStatus`, `changeProgress`, `delete`, `quickCreate`, subtasks, ...) pay for it:

| Action | Serial round trips today | After fix |
|---|---:|---:|
| Dashboard open (`+page.svelte:38-42`) | 2 | 1 |
| `/todos` open (`todos/+page.svelte:32-39`, see §3) | 3 | 1 |
| Tick a checkbox, change status/progress/effort, delete | 3 (PUT + 2) | 2 |
| Kanban drag to another column (see §2) | 5 | 2 |

On mobile (the main PWA use case) one round trip is easily 100–300 ms. The loading
indicator runs the whole time.

## 2. Finding: a Kanban drag reloads twice (verified)

`KanbanView.svelte:73-79`:

```ts
await todos.changeStatus(todoId, status);  // already ends with: if (res) await this.load();
await todos.load();                        // second full reload
```

`changeStatus()` (`Todos.svelte.ts:469-475`) already reloads on success. The extra
`load()` in the view fetches list, categories and workspaces again, in series. It
also runs when the PUT failed. That does no harm, but it is not needed there either.
`Status.svelte:30` calls the same `changeStatus()` without the extra reload, so
the Kanban view is the odd one out.

## 3. Finding: tags wait for the whole todo load (verified)

`todos/+page.svelte:36-38`:

```ts
await todos.load();
loadingIndicator.stop();
await Promise.all([tags.load()]);
```

`Tags.load()` (`Tags.svelte.ts:18-25`) only calls `GET /tags` and does not read any
todo state. Today it starts after the list, categories and workspaces are all back,
so the tag filters in the navigation show up one round trip after everything else.

## 4. Side effect: with "Hide it" on, hidden todos flash in (verified in the store)

`load()` sets `filteredTodos = this.todos` and groups them as soon as the list
arrives (`loaded` is already `true`). "Hide it" is applied only in `loadHideIt()`,
after workspaces come back. Probe result with "Hide it" on and one todo in a
hideable workspace:

| Moment | `filteredTodos` |
|---|---|
| list arrived, categories/workspaces pending | `['1', '2']` (hidden todo `1` visible) |
| `load()` done | `['2']` |

This happens on page open **and after every edit**, because every edit calls
`load()`. For one round trip, hidden todos show up and then disappear again. Not
checked in a browser, but the views render `filteredTodos`/`groupedTodos`, so it
should be visible.

## 5. Suggestion

Three small changes. Each one helps on its own.

1. **`Todos.load()`: start all three requests together, apply the results once all
   are back.** Sketch:

   ```ts
   async load(): Promise<void> {
   	const listRequest = this.apiService.list(apiRoutes.todos.list);
   	const related = Promise.all([this.loadCategories(), this.loadWorkspaces()]);

   	try {
   		const res = await listRequest;
   		await related;
   		if (res) { /* set loaded, todos, filteredTodos, checkUrlForFilter() as today */ }
   		/* score or sort, groupByStatus() as today */
   	} finally {
   		this.loadHideIt();
   	}
   }
   ```

   Keep today's failure rules: `todos`/`loaded` only change when the list request
   succeeded, and `loadHideIt()` still runs when categories or workspaces fail
   (the existing tests "still completes load() when the workspaces fetch fails for
   good" and "retries a failed workspaces fetch" cover this). If the list request
   throws, `related` must not end up as an unhandled rejection (the root layout
   treats those as network errors). One way to handle it is to `await related` in
   the `finally`. Because the list is applied after workspaces are in, `loadScores()` /
   `useFilters()` see the real workspaces, and the flash in §4 is gone. This is a
   change inside `load()` only (fetch → convert → assign, STANDARDS 12.2).
2. **`KanbanView.handleStatusChange`: drop the second `await todos.load()`.**
3. **`todos/+page.svelte` `onMount`: start `tags.load()` together with
   `todos.load()`** (e.g. `Promise.all([todos.load(), tags.load()])`). Stop the
   loading indicator after the todos part, as today.

## 6. Tests

In `tests/unit/stores/Todos.test.ts` (mocked `ApiService`, see `docs/TESTING.md`):

- `load()` issues the list, categories and workspaces requests before any of them
  resolves (deferred promises, like the existing "toggle while in flight" test).
- With "Hide it" on, `filteredTodos` never contains a todo from a hideable
  workspace once `loaded` is `true` (resolve the list first, then the rest).
- The existing hide-it tests ("restores the flag...", "retries a failed workspaces
  fetch...", "still completes load()...", "respects a toggle issued while load() is
  in flight") must pass unchanged.

The Kanban and page changes are one-line component changes. Per `docs/TESTING.md`
they don't need their own tests.

## 7. Risk

Low. Same requests and the same data as today, only in a different order. One
behaviour change: when the list arrives first, todos now show one round trip later
than today on a slow categories/workspaces response. The total wait is still
shorter than today's serial chain. Out of scope: replacing the reload after
each edit with a local patch (rejected for libraries, see the backlog entry above).
