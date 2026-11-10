# Report: the service worker precaches 1.3 MB it doesn't need

Date: 2026-11-10
Scope: what `src/service-worker.ts` downloads on install, plus `static/wood-shelf.jpg`.
Method: ran `npm run build` at `a16cc96`, pulled the precache list out of
`build/client/service-worker.js` and added up the file sizes. I used the `.br`
size where the build writes one (JS/CSS) and the raw size for everything else
(images and fonts are already compressed). Image sizes come from the file
headers. No code was changed.

**Overall: an easy performance win, mostly on first visit and after every
deploy.** About 46 % of what the service worker downloads is never needed by
most users, or never needed at all.

---

## 1. Finding (verified)

`service-worker.ts:12` precaches `[...build, ...files]`, which is every file the
build emits plus everything in `static/`. The cache name includes `version`, so
**every installed client downloads the whole list again after every deploy**,
in the background, right next to the page's own requests.

Precache at `a16cc96`: **335 files, 2.82 MB transferred** (5.36 MB raw).

What could be left out:

| What | Files | Transfer | Why it isn't needed |
|---|---:|---:|---|
| `/wood-shelf.jpg` | 1 | 426 KB | 1920×1356 photo, only used as a **5 px tall** strip (`SpineView.svelte:135`) |
| `/themes/{xp,skyrim}/wallpaper.jpg` | 2 | 601 KB | only used by two opt-in themes |
| `*.woff` font fallbacks | 17 | 218 KB | every browser that runs a service worker uses the `.woff2` next to it, so the `.woff` is never requested |
| `/logo.png`, `/logo_cut_small.png` | 2 | 59 KB | nothing in this repo references them (see 3.) |
| **Total** | 22 | **≈1.30 MB** | |

For comparison, the JS for *all* routes in the precache is 875 KB br. So the
wood texture alone is about half of the app's whole JS.

## 2. Suggested fix

Two small, independent changes:

**a) Shrink the shelf texture.** It is drawn 5 px tall at `center/cover`, so
only a thin horizontal slice is ever visible. Crop or resize it to something
like 1920×40 (I'd guess well under 20 KB, but I couldn't measure that because
there is no image tool in the container), or replace it with a CSS gradient.
This also helps users who never install the PWA, because the file is fetched
whenever a library spine view is shown.

**b) Filter the precache list** in `service-worker.ts`:

```ts
const LAZY = [/\.woff$/, /^\/themes\/.+\.jpg$/, /^\/wood-shelf\.jpg$/];
const ASSETS = [...build, ...files].filter((path) => !LAZY.some((re) => re.test(path)));
```

Files that get filtered out still go through the existing runtime branch
(`service-worker.ts:68-77`), so they are cached the first time a user actually
loads them (for example after switching to the XP theme) and keep working
offline from then on. The only trade-off: a user who has never opened that
theme or view won't have the image while offline. That seems fine for
decoration.

Checks for whoever picks this up: compare the `ASSETS` length in
`build/client/service-worker.js` before and after the change, and in DevTools
→ Application → Cache Storage, confirm that the wallpaper shows up in the
cache only after you switch to the theme.

## 3. Side findings (not chased further)

- **The push notification fallback icons don't exist.** `service-worker.ts:103-104,117`
  fall back to `/icon.png` and `/badge.png`, but `static/` has neither, so a
  push without an explicit `icon` shows the browser default (and 404s).
  `/android-chrome-192x192.png` exists and could be used instead.
- `static/logo.png` and `static/logo_cut_small.png` aren't referenced anywhere
  in this repo. The backend's emails might link to them by absolute URL, so
  check that before deleting them. Either way, they don't need to be precached.
- `discogs_icon.png` is 1024×1033 (74 KB) but is only ever shown at `size-6`
  (24 px). It's lazy-loaded with the library routes, so it doesn't affect the
  precache much, but it would be a cheap resize.
- I assumed prod serves the `.br` files that adapter-node writes (the default
  `precompress`). If the external deployment serves uncompressed files, the
  JS share of the precache is about three times larger, and the absolute
  savings above stay the same.
