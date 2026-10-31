# Backlog: libraries: bottom sheet for small create forms on mobile

created: 2026-10-31

## What

On mobile, `ContentModal` opens as a `BottomSheetModal` unless `forcePopup` is
set. The shared library create modal
(`src/lib/components/libraries/shared/CreateModal.svelte`) always passes
`forcePopup={true}` (commit `57cd6306`, "Popup modal forced for library"), so
every library opens its create form as a centered popup on mobile.

That fits the large forms with a cover area, rating and wishlist. The small
forms would be better as a bottom sheet, like the rest of the app on mobile.
The links form, for example, is only URL, title and tags.

Which libraries have the large form today (`config` in each
`src/lib/state/*Library.svelte.ts`):

| Library | hasCovers | hasRatings | hasWishlist |
|---------|-----------|------------|-------------|
| music, books, movies, games | yes | yes | yes |
| recipes | yes | yes | no |
| plants | yes | no | no |
| links, quotes | no | no | no |

## Why

A bottom sheet is the app's mobile pattern for modals. A small form in a
centered popup feels out of place next to it.

## Open decision

Decide before starting which rule picks popup vs. bottom sheet:

- **A: by config.** `forcePopup={library.config.hasCovers}` in `CreateModal`.
  One line; links and quotes get the bottom sheet, all cover libraries keep the
  popup. Plants keep the popup although their form is fairly small.
- **B: links only.** An explicit exception for links. Narrowest change, but
  the rule behind it is less obvious.
- **C: a prop.** `CreateModal` takes the choice from each library's create
  component. Most flexible, but each caller has to decide.

## Out of scope

- The detail modal (`libraries/shared/DetailModal.svelte`), which also forces
  the popup.
- Changes to `BottomSheetModal` itself.

## Notes

- The original reason for forcing the popup is recorded only as large forms;
  check the cover libraries still behave on mobile if the rule changes.
- Test the bottom sheet with the on-screen keyboard open and with the tags
  `MultiSelect` dropdown, which has to stay usable inside the sheet.
