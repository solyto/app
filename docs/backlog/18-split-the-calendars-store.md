# Backlog: 18 Split the Calendars store

created: 2026-10-14

## What

`state/Calendars.svelte.ts` is 621 lines with 55 public methods. Move the two self-contained blocks into their own stores:

- sharing and invites (`shareCalendar` … `declineInvite`, `openShareModal`, `closeShareModal`);
- import.

## Why

It is now the largest store, bigger than `Auth` was when rule 11.5 was written about it. Source: audit report §5.4.

## Out of scope

Navigation, events CRUD, attachments, drag moves. `Auth` (483 lines) is also above the line but is a separate decision.

## Notes

New stores follow 15.2 (constructor injection) and are created in `+layout.svelte` like the others. Move the matching tests from `tests/unit/stores/Calendars.test.ts`. Safety: tests, `check`, plus a manual run of share, accept/decline invite, and import. Rule: 11.5.
