# Report: the service worker's "stale-while-revalidate" waits for the network
read: false

Date: 2026-11-20
Scope: the fallback branch of the `fetch` handler in `src/service-worker.ts`.
Method: read the service worker, `svelte.config.js`, the route tree and the auth
routes at `e78ffbd`. No code was changed. Nothing was measured on a real device or
network; the latency effect is **inferred** from the code.

**Overall: a performance fix for every full page load of the installed PWA, plus a
small privacy fix.** The branch is called stale-while-revalidate, but it awaits the
network first and only then returns the cached copy. The cache never makes a page
load faster, and on a slow or hanging connection the app waits for the network even
though a usable copy is already cached.

---

## 1. Finding: the cached copy is returned only after the network answers (verified)

`service-worker.ts:80-86`:

```ts
// Stale-while-revalidate for everything else
try {
	const networkResponse = await fetch(event.request);
	if (networkResponse && networkResponse.status === 200) {
		await cache.put(event.request, networkResponse.clone());
	}
	return cachedResponse || networkResponse;
}
```

`cachedResponse` is already known at line 70, but it is returned only after
`fetch()` resolves **and** `cache.put()` has finished. `cache.put()` reads the whole
cloned body, so the response is held back until the full download is written to the
cache. In effect this is:

- **Online:** a full network round trip, then the *stale* copy. That's the latency of
  network-first combined with the staleness of cache-first.
- **Slow or hanging connection** (mobile "lie-fi", captive portal, half-open TCP):
  `fetch()` has no timeout, so the page waits until the browser gives up, even when
  a cached copy exists.
- **Offline:** the cached copy is used. This is the only case where the cache helps.

## 2. What goes through this branch (verified)

The precached `ASSETS` (`build` + `files`, line 20) are served cache-first at line 73,
so JS, CSS and static files are not affected. This branch handles everything else
that's same-origin, non-`/api` and `GET`:

- **Every full page navigation.** `svelte.config.js` uses adapter-node and no route
  sets `ssr = false` or `prerender`, so `/`, `/todos`, `/notes/123`, … are
  server-rendered HTML documents. They are not in `build`/`files`. This covers PWA
  launch, every reload, opening a link from a notification
  (`notificationclick` → `openWindow`), and the reload in
  `UpdateRequiredScreen.svelte`.
- The first fetch of each `LAZY` asset (theme wallpapers, opt-in fonts). Line 78
  serves them cache-first once cached, so only the first fetch is affected.
  That fetch also can't stream progressively, because of the awaited `cache.put()`.

Client-side navigation inside the running SPA doesn't fetch HTML, so it isn't
affected. The cost falls on **app start**, which is also the moment users notice
most.

## 3. Side finding: auth tokens and emails end up in Cache Storage (verified)

`cache.put(event.request, …)` keys on the full URL, query string included. These
routes carry secrets or personal data in the URL and get a `200` HTML response, so
they are cached:

- `/auth/reset-password?token=…&email=…` (`reset-password/+page.svelte:36-37`)
- `/auth/confirm-account-deletion?token=…&email=…` (`confirm-account-deletion/+page.svelte:28-29`)
- `/auth/verify/[user_id]/[token]`

On a browser where the service worker is already installed (any returning web
user), opening one of these mail links stores the token and email in Cache Storage
until the next deploy changes `version` and `activate` deletes the old cache. The
tokens are probably single-use (**not verified**, the backend is in a separate
repo), so the main exposure is the email address and the token sitting on disk on
shared machines. A fix costs one line, though.

The same keying also creates one cache entry per distinct URL (`/notes/<id>`,
`/check-in/date/<date>`, `?todo=…`, `?filterType=…`), so the cache grows without
bound within one version. That's minor, but the fix below covers it too.

## 4. Suggested fix

Respond from the cache right away and revalidate in the background with
`event.waitUntil`. This is safe here: the cache is per build `version`, so a cached
HTML document always references chunks that are in the same cache.

```ts
const cache = await caches.open(CACHE);
const cachedResponse = await cache.match(event.request);
// ...ASSETS / LAZY branches unchanged...

const network = fetch(event.request).then(async (response) => {
	if (response.status === 200 && cacheable(url)) await cache.put(event.request, response.clone());
	return response;
});

if (cachedResponse) {
	event.waitUntil(network.catch(() => undefined));
	return cachedResponse;
}

try {
	return await network;
} catch {
	return new Response('Offline – please check your connection.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
}
```

with `cacheable(url)` excluding `/auth/` paths and URLs with a query string. Two
notes:

- In the no-cache path, the response should be returned before `cache.put()`
  completes. Wrapping the put in `event.waitUntil` instead of awaiting it does that,
  and also lets the first load of a wallpaper stream.
- If serving a cached document on launch isn't wanted (e.g. so a server-side change
  to the HTML within the same build shows immediately), a **network-first with a
  short timeout** (~2–3 s, then cache) is the alternative. It fixes the "hangs on
  lie-fi" case but keeps the online round trip. Since the SSR HTML is only the app
  shell (no user data, see `AGENTS.md` "no server-side rendering of app data") and
  is versioned with the cache, true SWR looks like the better fit.

## 5. How to verify

Run `npm run build && npm run preview`, install the SW, then in DevTools → Network,
throttle to "Slow 3G" or add 3 s of latency and reload `/todos`. Before the fix, the
document request is served by the SW only after the full delay. After it, the
document comes from the SW right away. Also check Application → Cache Storage after
opening `/auth/reset-password?token=x&email=y`: there should be no entry for it.
The logic is also testable with a store-style Vitest test against a fake `caches` /
`fetch` (as was done for the notifications poller report), but `docs/TESTING.md`
has no recipe for the service worker yet.
