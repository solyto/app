# Backlog: 21 Notes import page

created: 2026-10-14

## What

`routes/notes/import/+page.svelte`: replace the raw file input and raw submit button with the shared `forms/` primitives, and move the ~8 untranslated strings into all four locale files.

## Why

Job 10 deferred it as its own job: it is the one page left with raw form controls and hardcoded English. Source: audit report §5.2.

## Out of scope

The import logic and its API call.

## Notes

The space-indented lines in this file are in backlog 16; do them here if this job runs first. Manual check: import a file end to end. Rules: 7.4, 8.1.
