# Backlog: Network errors leave the loading indicator running

created: 2026-10-15

## What

When a request fails at the network level (offline, connection dropped, a server error without CORS headers, an upload aborted by the server), `fetch` throws. `ApiService.fetchWithRecovery` lets that error propagate on purpose ("network errors propagate; never trigger logout"), but almost no caller catches it. The typical pattern

```ts
loadingIndicator.start();
const res = await store.something();
if (res) notifications.success(…); else notifications.error(…);
loadingIndicator.stop();
```

then never reaches `stop()` or the error notification: the loading indicator runs forever and the user gets no feedback.

Decide on one way to handle this across the app (e.g. the stores catch and return their usual failure value, or a shared wrapper around start/stop), and apply it.

Also in `ApiService`: `post`, `postRaw` and `put` accept `FormData | object`, but check `typeof body === 'object'`, which is also true for `FormData`. A `FormData` body would be sent as `JSON.stringify(formData)` (`"{}"`) with a JSON content type. `postWithStatus` was fixed for this; the others should follow or drop `FormData` from their signature.

## Why

Found with the clipboard image upload: an oversized upload got a 413 from nginx without CORS headers, `fetch` threw, and the page kept loading forever (fixed for the clipboard upload only). Any feature hits the same on a dropped connection.

## Out of scope

Retry logic, offline mode.

## Notes

Keep `fetchWithRecovery` from treating network errors as auth failures (it must never log out on them). Tests: `tests/unit/services/ApiService.test.ts` and the store tests in `tests/unit/stores/`.
