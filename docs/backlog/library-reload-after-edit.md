# Backlog: library edits — wrong success value, serial reloads

created: 2026-11-17

Source report: `docs/reports/2026-11-17-library-reload-after-every-click.md`.
Discussed in the room `small-improvements` (frontend + API) on 2026-11-17. Not
scheduled: the owner sees no value in doing it now.

## Findings (verified in code)

- **Every edit reloads the whole library.** In all eight stores
  (`src/lib/state/{Book,Movie,Music,Game,Recipe,Plant,Quote,Link}Library.svelte.ts`)
  `create` / `update` / `delete` / `updateRating` / `dragToCategory` end with
  `await this.load()`. `ApiService.update()` returns only `res.ok`.
- **`load()` is serial** in Book/Movie/Game/Music (list → genres) and Link
  (list → categories; Music also integrations, once per instance). A star click on
  a link is PUT + GET list + GET categories, one after another.
- **Success value is always true (bug).** The library mutation methods return
  `res !== null`, but for `update()` / `delete()` `res` is a boolean, so the result
  is always `true` (37 call sites across the eight stores, not all affected:
  `create` returns an object or null and is correct). Effect: when saving the edit
  form fails (422, 500, offline), `if (ok) library.closeCreateModal()` still closes
  the modal; the input is lost without any message.
- Overlapping `load()`s (two quick clicks) are not ordered; an older response can
  overwrite a newer one. Inferred, not reproduced.

API facts (checked by the API side in its repo):
- Library PUTs validate everything before writing; 422 = nothing stored, errors per
  field. After validation the write is **not** in a transaction
  (cover download → `update` → genres sync → tags sync), so a later failure leaves
  a partial write and returns 500.
- The PUT response already is the full updated entity in the list's shape
  (relations reloaded, scalars not re-read). `is_favorite`, `wishlist`, `completed`,
  `winter_hardy` have no boolean cast: the list returns `1`/`0`, the PUT returns
  what was sent.
- A PUT on one entry never changes other entries or the genre/category lists.
- Lists are sorted on the server (author/title/artist/name/created_at). The
  frontend does not sort.

## Options considered

1. **Swap the entry from the PUT response, no reload** (for all edits).
   Fastest (1 request). Rejected: a form edit that changes a sort field leaves the
   entry in the wrong place; changes from other tabs/devices no longer arrive with
   the next click; derived state (filters, counts, shelf) has to be maintained by
   hand in eight stores. The full reload is a deliberate choice to avoid exactly
   this.
2. **Swap only for rating / star / drag-to-category, form keeps reloading.**
   No sort problem (none of these fields is a sort key), but still loses the
   multi-tab freshness on those clicks and adds per-store update code. Rejected for
   the same reason.
3. **Re-sort locally after a swap.** Rejected: duplicates the server sort
   (collation, nulls, tiebreakers) and becomes its own drift source.
4. **Reload only the list after an entry edit, skip genres/categories.** Saves a
   request, but genres/categories changed in another tab would no longer refresh.
   Rejected; same latency as option 5.
5. **Keep the full reload, load list + genres/categories in parallel.** Same data,
   same freshness, saves ~1 round trip per click (~150 ms on mobile) in 5 of 8
   libraries. Unmeasured. Safe, but the gain is small.
6. **Latest `load()` wins** (discard older responses). Small, fixes the inferred
   race. Optional add-on to 5.
7. **Fix the success value.** Return the boolean from `update()` / `delete()`
   directly in all eight stores. Small, clear, testable; fixes the lost form input.

API-side options (would live in the API repo, independent of the frontend):
`DB::transaction` around update + syncs (cover download stays outside),
boolean casts for the tinyint flags, `refresh()` before returning.

## Conclusion (2026-11-17)

- The full reload after every edit stays. Options 1–4 are rejected.
- If picked up: **7** is the part with real value (bug). **5** (+ **6**) is a
  nice-to-have.
- No API change is required for 5–7.

## Out of scope

- Showing 422 field errors in the library forms (new UI; the forms show no errors
  today).
- `create` / `delete` behaviour beyond the success value.

## Tests (if picked up)

In `tests/unit/stores/LibraryStores.test.ts`, per store:
- `update` / `delete` / `updateRating` return `false` when `api.update` /
  `api.delete` resolve `false`, and do not call `load()`.
- (5) `load()` issues both list requests before either resolves.
- (6) An older `load()` response arriving last does not overwrite `entries`.
