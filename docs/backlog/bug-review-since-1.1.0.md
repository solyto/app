# Backlog: bug-focused review of the code changed since 1.1.0

created: 2026-11-21

## What

The standards audit of 2026-11-21 (`docs/reports/2026-11-21-standards-audit-since-1.1.0.md`)
checked the code against `docs/STANDARDS.md`. It was not a bug hunt, and
nothing was run in a browser. A dedicated correctness review of what changed
since 1.1.0 (222 commits, 308 files under `src/` at the time) is still open.
Much of it was written by AI with little human review.

The API has its own entry (`solyto/api` `docs/backlog/bug-review-since-1.1.0.md`);
do the two together.

## Suggestion

- Scope: `git diff 1.1.0..HEAD -- src`, by feature: external calendars, feed
  import, journal and hidden notes, account deletion, widget bridge, clipboard
  files, dev requests.
- Look for correctness, not style: error and offline paths, the loading
  indicator on every exit, timezone and date handling (e.g. the invalid
  check-in date that renders as 1970), state that isn't reset between
  navigations.
- Check on a phone as well as desktop, since several features have separate
  mobile variants.
