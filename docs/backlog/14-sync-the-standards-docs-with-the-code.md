# Backlog: 14 Sync the standards docs with the code

created: 2026-10-14

## What

Bring the documents that describe the code back in line with it after jobs 01–13.

- `docs/STANDARDS.md`: remove the duplicate section 1.10 (lines 231 and 252 are identical). Refresh the stale counts and paths: §1.5 (`{@const}` 40 → 1), §5.2 (29 → 10 `$effect` files), §7.1 check (19 → 8 files), §9 intro (`KeyManager` now lives in `state/`), §9.2 (`SupportedKey` list, ShelfView "known violation" is fixed), §11.1 ("only its path is wrong" is fixed), §14.1 (16 → 4 files), §15.2 (26 → 0 stores), §15.3 known violations (only `ManageWeatherCity` left).
- `docs/STANDARDS.md` §1.10: trailing commas are now enforced by ESLint (`comma-dangle: never`, 64b4069); add that as the rule's check.
- `docs/STANDARDS.md` "Decisions": record the owner's decision from 2026-10-14 that "reset X when Y changes" is written as an explicit reset where the change happens (a handler, `afterNavigate`, the store's setter), not as a writable `$derived` with `void dep` and not as `{#key}`. Examples: the check-in draft (c4a6c12) and the library `shelfIndex` (828a402).

## Why

The standard is only useful if its greps and counts are true. Right now an agent reading "26 stores still use it" goes looking for stores that no longer exist. Source: `docs/reports/2026-10-14-standards-refactor-audit.md` §5.5.

## Out of scope

Changing any rule's content. Code changes.

## Notes

Re-run each rule's "Check:" grep (the audit report's appendix lists them) and use those numbers, not the report's. Docs only, so the safety check is `git diff` review.
