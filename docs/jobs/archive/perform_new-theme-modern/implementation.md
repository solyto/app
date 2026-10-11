## Summary

Added a new **Modern** theme to solyto: a clean, professional, Notion-inspired
look as a counterpart to the mostly playful existing themes. It is a light-only
theme (like `paper`/`catppuccin-latte`): white canvas, warm-gray sidebar
(`#f7f6f3`), warm near-black text (`#37352f`), Notion-blue accent (`#2383e2`),
whisper hairlines and restrained multi-layer shadows, all on a **system font
stack** (Notion ships no webfont — SF/Segoe UI/Roboto per platform). The navbar
(desktop rail + mobile bottom bar) becomes a **flat bar, flush to the window
edges, with square corners** — on both desktop and mobile.

## Changes

**TASK-1 — `static/themes/modern/modern.css` (new file).** Token set covering
every family the other themes define: `--t-font-body`/`--t-font-heading`/
`--font-sans` (system stack), `--color-c-*` semantic colors (Notion palette:
blue `#2383e2`, red `#d44c47`, green `#0f7b6c`, yellow `#cb912f`), backgrounds
(white canvas, `#f7f6f3` via the gradient tokens), `--color-d-*` light-blue
surfaces, `--color-s-dark*` remapped to light values so `dark:` utilities stay
sane, a warm Notion gray scale (gray-700 = `#37352f`, the base body text),
`--t-gradient-colors` (flat `#f7f6f3, #f7f6f3`), restrained shadows, an
`html.dark` light-enforcement block (paper pattern) and a subtle `.logo`
desaturation filter. **Radius tokens are untouched** — the whole app keeps its
normal rounded corners; only the nav bar goes square.

**TASK-2 — `src/lib/config/themes.ts`.** Registered `{ id: 'modern', name:
'Modern', supportsDarkMode: false, previewBg/previewSurface/previewText/
previewAccent: #ffffff/#f7f6f3/#37352f/#2383e2 }` as the last entry; `default`
stays first. No i18n keys needed (theme names are hardcoded). `themes.test.ts`
(unique ids, hex preview fields) and `Theme.test.ts` pass.

**TASK-3 — nav overrides in `modern.css`.** Scoped to the nav hook classes
(`.nav-desktop-container`, `.nav-desktop`, `.nav-mobile-container`,
`.nav-mobile`), which are used only by `DesktopNavbar.svelte` /
`MobileNavbar.svelte`:
- `.nav-desktop-container` / `.nav-mobile-container { padding: 0 }` — removes
  the `p-1` gap to the window edge (flush).
- `.nav-desktop` / `.nav-mobile { border-radius: 0; box-shadow: none;
  filter: none }` — square corners, no gradient, no `drop-shadow-xl` (a filter
  utility, hence `filter: none`).
- Bars get the warm-gray `#f7f6f3` fill; hover `rgba(55,53,47,0.06)` / active
  `rgba(55,53,47,0.08)` + `#37352f` text stay legible and match Notion's
  subtle nav fills.
- **Decision, stated:** the mobile overflow popover (`.gradient-down` inside
  `.nav-mobile-container`) stays rounded and is restyled as a Notion menu —
  white surface, 1px hairline border, whisper shadow. The brief's "flat bar"
  requirement applies to the nav bar itself, not floating overlays (Notion
  popovers are rounded).

**TASK-4 — verification.** See "Known issues" for the environment-constrained
parts. What was verified:
- `npm run check` → 0 errors, 0 warnings.
- `npm test` → theme tests 20/20 pass (6 failures in `DateHelperExtended` +
  `logic-leaves` are pre-existing — reproduced identically against the pristine
  base `themes.ts`).
- eslint clean on `themes.ts`; new `modern.css` is prettier-clean (repo-wide
  `prettier --check` fails on 494 files pre-existing at the base commit).
- Dev server boots, serves `/themes/modern/modern.css` (HTTP 200), no console
  errors.
- **Playwright verification against the real compiled app CSS + real theme CSS
  + verbatim navbar DOM** (no backend API available, so a static harness):
  - desktop/mobile container padding `4px → 0px` (flush),
  - bar `border-radius 6px → 0px`, `filter: drop-shadow → none`,
    `box-shadow: none`, background `teal/green gradient → #f7f6f3`,
  - active nav `rgba(55,53,47,0.08)` + `#37352f`, hover
    `rgba(55,53,47,0.06)` — legible,
  - body font = system stack, 16px, `#37352f`,
  - mobile popover = white + `1px rgba(0,0,0,0.1)` + 8px radius + whisper
    shadow. Screenshots at `/tmp/opencode-ts/modern-{desktop,mobile}.png` for
    the pipeline.
- Appearance section hidden: `AppSettings.svelte` renders it only when
  `theme.supportsDarkMode` (modern = false); `ThemeState.apply()` drops the
  `dark` class (covered by existing store tests).

## Known issues / follow-ups

- **Production build OOMs in this container** (`npx vite build` is killed
  during the final gzip phase; 1964 modules transform fine). Resource
  limitation of the sandbox, not a code issue — no build errors/warnings
  related to this change.
- **Pre-existing repo failures, not caused by this job:** `npm run lint`
  fails `prettier --check` on 494 files (incl. `themes.ts` at the base
  commit); 6 Vitest failures in `DateHelperExtended.test.ts` (date-sensitive)
  and `logic-leaves.test.ts` (`StatisticWidget` `.bg-blue-50` query) — both
  reproduced unchanged on the base `themes.ts`.
- No backend API in this environment, so the authenticated app (real navbar in
  a live session) couldn't be exercised end-to-end; the CSS cascade was
  verified with a Playwright harness instead (see TASK-4).
- `supportsDarkMode: false` means no dark mode for Modern (per the analyst's
  assumption; adding an `html.dark` token block would be a clean follow-up).
- Mobile overflow popover deliberately stays rounded (Notion menus are
  rounded); only the nav bars are square.