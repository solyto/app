# Backlog: 01 Green the test gate

created: 2026-10-12

## Status (2026-10-12)

`npm test` and `npm run check` are green in the main checkout (done outside
the job workflow): the six tests, the two genuinely unused parameters, the
`console.log`. `noUnusedParameters` was tried and rejected: it flags
contract parameters (rule 12.1, exception). Prettier was removed from the repo the same day (owner
decision: it rewrote deliberate formatting), so `npm run lint` is now
`eslint .` alone. Its 233 errors were worked through rule by rule with the
owner on 2026-10-13; `npm run lint`, `npm run check`, `npm test` and
`npm run build` are all green. The rule decisions (options, the one rule
turned off, where disable comments are allowed) are recorded in
`STANDARDS.md` under decisions. This entry is done.

## What

Make `npm test`, `npm run check` and `npm run lint` all pass, so every later refactoring job can rely on a green gate.

- Fix the six failing tests: five in `tests/unit/helpers/DateHelperExtended.test.ts` that pin "today" to August 2025, one in `tests/components/logic-leaves.test.ts` (`StatisticWidget` colour classes).
- Remove the genuinely unused parameters in `Calendars.loadEvents()` and `Notes.updateFavoriteStatus()` (rule 12.1). Do not enable `noUnusedParameters`; see the rule's exception.
- Remove the leftover `console.log` in `calendars/EventEdit.svelte:90`.

## Why

A refactoring backlog is only safe if "the suite is green" means something; today it does not.

## Out of scope

Any behaviour change. Any refactoring beyond what the tooling demands.

## Notes

The date tests must assert against the real `new Date()`; `SvelteDate` ignores fake timers (`TESTING.md`, caveats). Rules: `STANDARDS.md` 12.1, 1.1, 3.5.
