# Backlog: 22 Weather city search outside ApiService

created: 2026-10-14

## What

`weather/ManageWeatherCity.svelte` searches for cities by calling OpenStreetMap's public Nominatim service straight from the browser: a raw `fetch` to a URL built in the component (`https://nominatim.openstreetmap.org/search?q=…`). That breaks rule 15.3 twice: a `fetch` outside `ApiService`, and a URL outside `apiRoutes`/config.

It can't simply be routed through `ApiService`. That would send the user's Bearer token to a third party, and a 401 from Nominatim would trigger the session recovery (refresh or logout) because of someone else's server. Job 09 stopped here for that reason (open question 1).

Options:

- (a) Record it in 15.3 as a second accepted direct call, next to the setup health check, and move the URL into `config/`. No behaviour change.
- (b) Add a tokenless `ApiService` method that never sends the token and never runs recovery, with the URL in config. Satisfies the letter of 15.3, but adds a method whose purpose is to opt out of everything `ApiService` does.
- (c) Proxy the search through the backend (e.g. `/api/v1/weather/cities?q=…`), so the browser only talks to the solyto API. Best for privacy (OpenStreetMap no longer sees users' IPs and what they type), and fits Nominatim's usage policy (server-side caching, a proper User-Agent). Needs backend work in the other repository and changes behaviour.

## Why

It is the last open rule 15.3 violation after job 09. Source: audit report §5.2; job 09 `tasks.md` open question 1.

## Out of scope

The weather feature itself (forecast loading, the `Weather` store).

## Notes

Decide the option when the job is picked up. Suggestion from the audit discussion: (a) now, since it needs no behaviour change, and (c) later as its own backend feature for privacy reasons. If (c), the backend endpoint comes first and the client change follows in this repo. Rule: 15.3.
