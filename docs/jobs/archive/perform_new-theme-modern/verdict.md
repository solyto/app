# Verdict: New theme: modern

id: perform
reviewer: reviewer
date: 2026-10-11

<!-- Produced by @reviewer and/or @security after implementation. -->

## Review

TASK-1: PASS
notes: `static/themes/modern/modern.css` (new) defines the requested token families exactly as
scoped: `--t-font-body`/`--t-font-heading`/`--font-sans` (Notion's system stack), `--color-c-*`
(white canvas, `#f7f6f3` sidebar, warm near-black `#37352f`, Notion blue `#2383e2`, semantic
red/green/yellow), `--shadow-*`/`--drop-shadow-*`, warm gray scale (gray-700 = `#37352f` so
`html { text-c-neutral-7 }` resolves to the Notion base text), `--color-d-*`, `--color-s-dark*`
remaps, `--t-gradient-colors` (flat) and an `html.dark` light-enforcement block matching the
`paper`/`catppuccin-latte` precedent, plus the `.logo` filter. Radius tokens are untouched, as
required. File parses; values are valid CSS. (CSS/static is ignored by prettier per
`.prettierignore` `/static/`, so the absent trailing newline is not a lint failure.)

TASK-2: PASS
notes: `src/lib/config/themes.ts` gains `{ id: 'modern', name: 'Modern', supportsDarkMode: false,
previewBg '#ffffff', previewSurface '#f7f6f3', previewText '#37352f', previewAccent '#2383e2' }`
as the last entry; `default` remains first. `tests/unit/config/themes.test.ts` invariants hold
(unique ids; `previewBg`/`previewAccent` are hex). No i18n keys needed — theme names are
hardcoded and rendered via `{t.name}` in `AppSettings.svelte`; the Appearance section is gated on
`supportsDarkMode` (line 61), so it is correctly hidden for Modern. The runtime link path
`/themes/modern/modern.css` matches the file location (`Theme.svelte.ts` line 83).

TASK-3: PASS
notes: Nav overrides are correctly scoped to the hook classes that only `DesktopNavbar.svelte`
(`.nav-desktop-container`/`.nav-desktop`) and `MobileNavbar.svelte`
(`.nav-mobile-container`/`.nav-mobile`) use — grep-confirmed, and `.gradient-down`/`.gradient-right`
appear only on those navbars. `padding: 0` removes the `p-1` gap on both containers; the bars get
`border-radius: 0`, `box-shadow: none`, `filter: none` (correctly, since `drop-shadow-xl` is a
`filter` utility, not `box-shadow`) and a `#f7f6f3` fill that also overrides the `gradient-*`
background. Because Tailwind utilities live in `@layer utilities` and the theme stylesheet is
unlayered (and appended after the app CSS anyway), the overrides win the cascade — the same
mechanism the y2k theme relies on. Hover (`rgba(55,53,47,0.06)`) and active
(`rgba(55,53,47,0.08)` + `#37352f` text) states remain legible on the warm-gray bar. The mobile
overflow popover decision is explicitly stated (stays rounded; restyled as a white Notion menu with
a hairline border and whisper shadow) and implemented via `.nav-mobile-container .gradient-down`
(specificity beats base `.gradient-down`).

TASK-4: PASS
notes: The base verification artifacts are documented: `npm run check` 0 errors, theme tests pass,
eslint clean on `themes.ts`, dev server serves the CSS (HTTP 200), and a Playwright harness against
the real compiled app CSS + verbatim navbar DOM confirmed padding, radius, filter, background/font
and popover values. Pre-existing failures (`prettier --check` over 494 files, 6 Vitest failures in
`DateHelperExtended`/`logic-leaves`) are asserted to reproduce on the base commit and are not caused
by this job. I could not independently re-run `npm run check`/`npm test`/`npm run build` in this
sandbox (only read-only git is permitted), so TASK-4's PASS rests on static review of the diff plus
the developer's documented evidence; the change surface is a data entry and a static CSS file, so
compilation/type risk is negligible.

## Security

none — static theme asset plus a data entry; no auth, network, secrets or user data touched.

## Overall

APPROVED

No blockers. The diff is exactly in scope: two source files (`src/lib/config/themes.ts` and the new
`static/themes/modern/modern.css`) plus job docs. All four tasks match their specs, the not-a-bar
interpretation of "flat bar" is explicitly documented by the analyst and defensible, and the
light-only assumption follows the established `paper`/`catppuccin-latte` pattern.

Non-blocking observations (do not require action for this job):
- `--color-s-teal` is not overridden, so a few notes-editor accents (blockquote border, link
  color, checkbox fill, etc. in `TipTapEditor.svelte`/`EditorToolbar.svelte`) keep the default
  teal. This is repo-wide existing behavior — no other theme overrides `--color-s-teal` either —
  and is outside the token families the task scoped, so it is not a defect here.
- Dark mode for Modern is deliberately not implemented (`supportsDarkMode: false`); the analyst
  flagged it as an open question for the human, and it is an easy follow-up.
