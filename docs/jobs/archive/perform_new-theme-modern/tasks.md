# Tasks: New theme: modern

id: perform
analyst: analyst
date: 2026-10-11

<!-- Produced by @analyst from brief.md. -->

## Context

### What the brief asks
- A new "modern" theme that reads like Notion: clean, modern, professional (as opposed to
  solyto's mostly playful themes).
- Navigation must be a **flat bar with no spacing to the border and no rounded border**, on
  desktop **and** mobile.
- Research what makes Notion well designed and copy as much as possible, **fonts included**.

### How themes work in this repo (ground truth)
- A theme is two things: a CSS file at `static/themes/<id>/<id>.css` **and** an entry in
  `src/lib/config/themes.ts`. The `id` must match the directory/file name.
- `src/lib/state/Theme.svelte.ts` `apply()` injects `<link href="/themes/<id>/<id>.css">` into
  `<head>` for every theme except `default` (default is already in the app bundle). The link is
  appended **after** the bundled app CSS, so an equal-specificity theme rule wins the cascade.
  This is the established way theme CSS overrides Tailwind utility classes — proven by
  `static/themes/y2k/y2k.css` overriding `.nav-desktop-container { padding: 0 }` over the
  component's `p-1`.
- `supportsDarkMode: false` makes `ThemeState` remove the `dark` class and skip the OS
  colour-scheme listener; the settings "Appearance" section is then hidden (`AppSettings.svelte`
  line 61). Light-only themes are the majority (8 of 10) — `paper` and `catppuccin-latte` are the
  clean-light precedents.
- Theme **names are hardcoded** in `themes.ts` and rendered directly in `AppSettings.svelte`
  (`{t.name}`); they are **not** i18n keys. The settings swatch is generated from the `preview*`
  fields. So no i18n and no UI-component work is needed.
- Tests: `tests/unit/config/themes.test.ts` asserts unique ids + hex `preview*` fields;
  `tests/unit/stores/Theme.test.ts` exercises `nord`/`default`. Both must keep passing. CSS itself
  is not unit-tested (there are no component/integration tests).

### Navigation DOM — the hook classes to target
- Desktop (`src/lib/components/ui/DesktopNavbar.svelte`, lines 22–25):
  outer `.nav-desktop-container h-full bg-c-bg p-1` → inner
  `.nav-desktop gradient-down flex … rounded-md p-1 … drop-shadow-xl`.
- Mobile (`src/lib/components/ui/MobileNavbar.svelte`, lines 48–50):
  outer `.nav-mobile-container h-full p-1 bg-c-bg` → inner
  `.nav-mobile gradient-right … rounded-md …`; its overflow menu (line 90) is
  `.gradient-down … rounded-lg`.
- `.gradient-down` / `.gradient-right` are used **only** by these two navbars (grep-confirmed), so
  flattening them per-theme only affects the nav.
- These hook classes have **no CSS in `src/`** — they exist purely to be styled by theme CSS (the
  same pattern documented in the archived `client_skyrim-theme-transparency` job).
- The layout constrains the nav: desktop wrapper `hidden h-full 2xl:block`, mobile wrapper
  `block h-16 w-full 2xl:hidden` (`src/routes/+layout.svelte`, lines 134–152). The `p-1` on the
  two `*-container` elements is what currently creates the gap to the window border.

### Notion design research (condensed, for the CSS author)
- **Light UI surfaces:** canvas `#FFFFFF`, sidebar/panel `#F7F6F3`, subtle hover; primary text
  `#37352F` (warm near-black), secondary/muted text `#787774`/`#9B9A97`; hairline borders
  `1px solid rgba(0,0,0,0.1)` (~`#E9E9E7`).
- **Accent:** Notion blue `#2383E2` (in-app) / `#0075DE` (marketing); pressed `#005BAB`. Semantic:
  green `#0F7B6C`/`#448361`, red `#D44C47`, orange `#D9730D`, yellow `#CB912F`.
- **Typography:** the product UI uses a **system font stack** (SF on Apple, Segoe UI on Windows,
  Roboto on Android, Inter-like on the web) — not a bundled webfont. Body 16px/400/1.5, UI/labels
  500–600, headings 600–700 with slight negative tracking.
- **Depth:** deliberately flat — flat fills, whisper 1px borders, multi-layer shadows with
  cumulative opacity < 0.05.
- **Geometry:** rectangular; small radii (buttons ~4–8px, menus ~8px, cards ~8–12px). Buttons are
  **not** pills.

### Interpretation + assumptions (explicit — do not silently change)
- **"Flat bar"**: read as making the existing navbar (desktop left rail, mobile bottom bar) flush to
  the window edges (drop the outer `p-1`), square-cornered (drop `rounded-md`) and flat (no gradient
  / no drop shadow). Done in theme CSS scoped to the nav hook classes, desktop and mobile.
  If a *horizontal top navigation bar* was actually meant, that is a structural layout change and is
  **out of scope** here — surface it rather than guessing.
- **Dark mode:** assumed **out of scope** — `supportsDarkMode: false` (light-only), following the
  `paper`/`catppuccin-latte` pattern and the brief's focus on the clean light Notion look. Notion
  does have a dark mode, so adding one (an extra `html.dark { … }` token block) is a clean follow-up,
  but it is not requested. **Open question for the human: should `modern` also support dark mode?**
- **Fonts:** because Notion uses a system stack, **no new `@fontsource` package is needed** (and the
  hard rules forbid installing dependencies without asking). Use a system stack.
- **Do NOT zero the global `--radius-*` tokens** — that is the y2k/atari gimmick and would square
  every card/button/menu. Only the nav bar itself goes square.
- `static/themes/y2k/y2k.css` exists but is **not** registered in `themes.ts`; leave it untouched.

## Task breakdown

TASK-1: Create `static/themes/modern/modern.css` with the light, Notion-inspired token set
(warm-white canvas `#ffffff`, sidebar `#f7f6f3`, warm near-black text, Notion-blue accent,
whisper borders, restrained shadows, system font stack) covering the token families other themes
define (`--t-font-body`/`--t-font-heading`, `--color-c-*`, `--color-d-*`, `--color-s-dark*`
overrides so `dark:` utilities stay sane, gray scale as needed, `--t-gradient-colors`) plus an
optional subtle `.logo` filter. Keep normal radii (do not zero `--radius-*`). No nav rules in this
task.
files: static/themes/modern/modern.css
depends: none
risk: low — new file, inert until it is registered in TASK-2.

TASK-2: Register the theme in `src/lib/config/themes.ts` — `id: 'modern'`, `name: 'Modern'`,
`supportsDarkMode: false`, and four `preview*` hex fields matching the palette; keep `default` as
the first entry.
files: src/lib/config/themes.ts
depends: TASK-1 (the id must match the CSS path `static/themes/modern/modern.css`)
risk: low — pure data; `themes.test.ts` (unique ids, hex preview fields) must still pass.

TASK-3: Add the modern-theme navigation overrides to `modern.css`: set
`.nav-desktop-container`/`.nav-mobile-container { padding: 0 }` (flush to the border),
`.nav-desktop`/`.nav-mobile` square (no `rounded-md`) and flat (no gradient / no drop shadow) with
themed sidebar/canvas backgrounds, ensuring hover/active nav states stay legible. Cover **both**
desktop and mobile. Decide explicitly what to do with the mobile overflow popover (Notion popovers
are rounded, so leaving it rounded is defensible — state the choice).
files: static/themes/modern/modern.css
depends: TASK-1
risk: medium — relies on the theme stylesheet loading after the app CSS (the established y2k
specificity pattern) and must stay scoped to the nav hook classes so no other theme or surface
changes.

TASK-4: Verify: run `npm run check`, `npm run lint`, `npm test`; then in `npm run dev` select
Modern and confirm the palette/typography, the nav is flush + square + flat at desktop (≥2xl) and
mobile widths, hover/active nav states are legible, the Appearance section is hidden (light-only),
and switching back to `default` and one other theme leaves them visually unchanged with no console
errors.
files: none
depends: TASK-1, TASK-2, TASK-3
risk: low — verification only.

## Out of scope
- Structural navigation changes (e.g. converting the desktop rail to a horizontal top bar).
- Dark mode (unless the open question above is answered "yes").
- New fonts or any new dependency.
- Registering or modifying the unregistered `y2k` theme.
- i18n changes (theme names are not translated).
- Renders/screenshots (produced by the pipeline, not the developer).
