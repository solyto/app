# Backlog: 01 Green the test gate

created: 2026-10-12

## What

Make `npm test`, `npm run check` and `npm run lint` all pass, so every later refactoring job can rely on a green gate.

- Fix the six failing tests: five in `tests/unit/helpers/DateHelperExtended.test.ts` that pin "today" to August 2025, one in `tests/components/logic-leaves.test.ts` (`StatisticWidget` colour classes).
- Set `"noUnusedParameters": true` in `tsconfig.json` and fix what it reports (three hits in `Calendars.svelte.ts:117` and `Notes.svelte.ts:392`, plus whatever `npm run check` finds in components).
- Remove the leftover `console.log` in `calendars/EventEdit.svelte:90`.
- Fix the Prettier failures in `calendars/views/week/Day.svelte` and `calendars/CalendarMarks.svelte` without re-folding the attributes (see `STANDARDS.md` 1.1, 3.5).

## Why

A refactoring backlog is only safe if "the suite is green" means something; today it does not.

## Out of scope

Any behaviour change. Any refactoring beyond what the tooling demands.

## Notes

The date tests must assert against the real `new Date()`; `SvelteDate` ignores fake timers (`TESTING.md`, caveats). Rules: `STANDARDS.md` 12.1, 1.1, 3.5.
