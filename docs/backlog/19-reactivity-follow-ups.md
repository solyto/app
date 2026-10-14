# Backlog: 19 Reactivity follow-ups

created: 2026-10-14

## What

- `routes/notes/journal/[date]/+page.svelte`: the `$effect` that watches `notes.loaded` and `page.params.date` with an `openedKey` guard (5.3 "the tell"). The store exposes an open-by-slug method and the page calls it on navigation (job 11 open question 1).
- `routes/time-tracking/[id]/+page.svelte`: the redirect effect `if (tt.loaded && !project) goto(…)` (job 11 open question 4).
- `tour/WelcomeTour.svelte`: the effect that writes `targetRect`/`transitioning` via `untrack` (5.1).
- The four `charts/*.svelte` wrappers: the effect has no reactive dependency left and runs once, so make it `onMount` like `MobileDayView`/`MobileMonthView`.
- The writable-`$derived` reset idiom (`void dep; return …`) in `libraries/shared/ShelfView.svelte`: reset `activeIndex` explicitly where the change happens. Owner decision: explicit resets, not the idiom and not `{#key}`.
- `calendars/EventEdit.svelte:67`: the `state_referenced_locally` warning from `svelte-check`, so the gate is back to 0 warnings.

## Why

After job 11, these are the only places left where reactivity is used to sync state. The repo policy treats `$derived`/`$effect` as smells. Source: audit report §3.2, §5.3.

## Out of scope

The seven legitimate 5.2 effects (`UpdateChecker`, `FeedView`, `CoverImage`, the charts' echarts lifecycle itself).

## Notes

Journal and time-tracking change navigation behaviour, so check them by hand (direct URL load, in-app navigation, back button). Rules: 5.1–5.6, 3.2.
