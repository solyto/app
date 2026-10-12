# Backlog: 10 Use the shared primitives in todo props

created: 2026-10-12

## What

Rebuild `todos/props/Recurrence.svelte` from the shared primitives (`NumberInput`, `DateInput`, `TextButton`, `InlineDeleteButton`, the portal helper for the popover) and translate its strings; then audit the other 18 files with a raw `<input>` outside `forms/` and fix the ones that are not justified inline triggers.

## Why

The component works but looks like it belongs to another app, and it is the reference bad example for rule 7. The audit stops it from being the only one fixed.

## Out of scope

New primitives beyond adding a missing prop to an existing one. Changing recurrence behaviour.

## Notes

No unit seam; `check`, `lint`, i18n key parity and a manual pass. For each audited file, record in the implementation notes whether it was a 7.4 case or a fix. Rules: 7.1–7.4, 8.1.
