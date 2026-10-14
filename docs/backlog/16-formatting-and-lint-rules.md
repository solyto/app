# Backlog: 16 Formatting fixes and lint rules for the hand rules

created: 2026-10-14

## What

- Rule 1.10: add semicolons to the six files that have none (`notes/editor/{InsertImageModal,InsertLinkModal,TipTapEditor,TableBubbleMenu,EditorToolbar}.svelte`, `tour/WelcomeTour.svelte`).
- Rule 1.10: switch the space-indented lines to tabs in `forms/FileUpload`, `ui/LoadingIndicator`, `desktop/TitleBar`, `types/notification_settings.ts`, `routes/notes/import/+page.svelte`.
- Rule 1.10, "no trailing comma": about 250 sites violate it (left over from Prettier). Either enforce it with ESLint `comma-dangle: never` and fix them, or drop it from the standard.
- Add ESLint rules for what can be linted: `semi: always`, and `no-restricted-syntax` (or the Svelte equivalent) for `role="button"` on a `span` (4.1).

## Why

Rules nobody follows are noise in the standard, and these three can be enforced by a tool instead of a reviewer. Source: audit report §5.1, §6.4.

## Out of scope

Introducing a formatter. Other lint rules.

## Notes

The trailing-comma decision belongs to the owner; ask before choosing. The 4.1 lint rule can only go to error after backlog 15 has removed the 19 spans. Whitespace and punctuation only, so safety is `lint`, `check` and tests. Rules: 1.10, 4.1.
