# Report: optional end-to-end encryption, app side
read: true

Date: 2026-11-18
Scope: the whole app (`src/`), with a summary of the API findings. The API side has its own report in the api repo: `docs/reports/encryption-feasibility-2026-11-18.md` (gwendolyn).
Method: read the code at the current `feature/cold_solyto-encrypted` head; went through five rounds on downsides and fixes with the API side; the owner answered the open questions. No code was changed. Working notes: `docs/jobs/cold_solyto-encrypted/encryption-research.md`.

**Overall: feasible and worth doing, as one opt-in switch that encrypts every area we support, built in phases.** Most of the app already searches, filters, sorts and computes stats on the device, so encrypted users lose little. Users who don't turn it on lose nothing.

---

## 1. What the user gets

- **One switch, "Encrypt my data".** It covers every supported area. Areas supported later are encrypted automatically on the next unlock. Settings list what's covered.
- **A second password just for encryption**, plus a recovery code shown once. This works the same for password and passkey users. It has to be separate: the server sees the login password at every login and during CalDAV/CardDAV auth, so a key derived from it wouldn't be secret.
- **Unlock once per device.** The device remembers the key by default. Fingerprint/Face ID unlock works where supported (WebAuthn PRF), and an auto-lock is optional.
- **Not covered:** feeds (the server must fetch the URLs) and library titles/metadata (needed for covers, details, release alerts and recommendations; personal notes and ratings can be covered). Calendars and address books are covered only when the user picks them, and default to none.

## 2. Accepted downsides (owner decision)

Users make these trade-offs themselves:

1. Lost encryption password + lost recovery code + every remembered device gone = data gone.
2. Encrypted calendars and address books don't sync to phone or Thunderbird apps (they're hidden from DAV).
3. Encrypted calendars can't be shared with friends in v1.
4. Email, Telegram and ntfy reminders show counts only. Push notifications can show titles, decrypted on the device.
5. The Telegram bot can't show encrypted items.

Other downsides, with their limits:

6. **Dates stay readable**: appointment start, end and repeat rule, due and completion dates, check-in days, journal dates (the journal title is the date), and created/updated timestamps. The server needs them for recurrence, reminders and calendar markers. A leak shows *when*, not *what*.
7. **Old copies**: backups made before switch-on keep plaintext for up to 7 days (current retention). Caches, export files and stored notifications are purged at switch-on. The UI says "older backups are deleted within 7 days" rather than "protected instantly".
8. **Switch-on takes time** for users with many image-heavy notes (note images are inline base64). There's a progress bar and pause/resume.
9. **Web version**: whoever serves the JS could steal keys. The desktop (Electron) and mobile (Capacitor) apps bundle their code, so they're stronger.
10. **No rescue**: nobody, the admin included, can read or repair encrypted content.
11. **Ongoing developer cost**: every future server feature that reads content (VTODO sync, server search, AI on notes, new reminder types) has to run in the app or skip encrypted data.

**Not downsides** (checked): search, filters, sorting, stats, dashboard, quick add, import, export, recurring todos, and widgets once the native shell stores the key.

## 3. Why it fits the app

- Lists are loaded whole and processed on the device: `NoteSearchService`, `TodoFilterService`, `TodoSortingService`, `TodoRelevanceService`, `LibraryFilterService`, `WealthStatisticsService`, `BudgetIntervalService`, `JournalService.findEntry`.
- All traffic goes through `ApiService` and one store per domain, which gives a single place to encrypt on write and decrypt on load.
- The service worker never caches `/api` (`src/service-worker.ts`), and localStorage holds no content (checked every key).
- WebCrypto covers everything: AES-GCM, HKDF, PBKDF2, ECDH P-256. **No new dependency** unless Argon2 is wanted (still open, see §7).
- Quick add's type detection on the server is plain keyword/URL matching, so the app can copy it.

## 4. Design

- **Keys**: a random data key (AES-256-GCM), stored on the server only wrapped by the encryption password, the recovery code and optionally a passkey (PRF). Wrapped keys are stored per device so a single device can be revoked. In the browser the key is a non-extractable `CryptoKey`, remembered in IndexedDB per API URL + user id (desktop and mobile can switch servers and accounts) and wiped on logout.
- **Envelope**: `enc:v1:<key id>:<iv>:<ciphertext>` per field. Each row carries its own state, so a half-migrated area stays readable and key rotation works.
- **What gets encrypted**: content fields only (titles, descriptions, note content, names). Structure stays plaintext: ids, dates, status, relations. Check-in days and finance values are encrypted as **one blob per row**, so NULL patterns don't reveal which trackers someone uses or the amounts. Tag and folder names are encrypted as soon as encryption is on, because tags are shared across 8 areas and would give away what notes are about. The server deduplicates tags via a keyed hash (blind index).
- **Journal**: titles stay plain dates (the server's journal marks query by title), and the app doesn't allow renaming an entry to anything else.
- **Moves into the app for encrypted users**: todo syntax parsing (`#tag`, `/category`, `due:`, `repeat:`), tag/category lookup by name, quick add detection, note/ICS/vCard import, note sorting by title, wealth sorting by value, time-tracking statistics.
- **Push with titles**: the server puts the stored ciphertext titles into the push payload (capped for the ~4KB limit, then "+X more"), and the service worker decrypts with the IndexedDB key. The service worker can't fetch, because the auth token is in localStorage. A locked device shows counts.
- **Telegram bot / server-created entries**: a per-user P-256 key pair lets the server seal new entries it can't read afterwards. The same key pair later enables calendar sharing.
- **Failure handling**: a field that fails to decrypt is shown read-only with a placeholder, and saving is blocked. Otherwise TipTap autosave would write the garbage back. The server rejects plaintext saves for encrypted users with a `422 encryption_required` (this doubles as the guard against old clients and locked devices).
- **Turning it on**: the app downloads, encrypts and uploads in batches, with `updated_at` checks against a second device editing at the same time. It resumes after interruption, and the server marks an area done once no plaintext rows are left.

## 5. Plan

**Phase 0, for all users, worth doing regardless**
- Content-Security-Policy (there is none today; one injected script could use the key).
- `Cache-Control: no-store` on `/api/v1` (API side; today browsers may keep responses on disk).
- Stored notifications keep ids/counts, not todo/event titles (API side; today titles sit in the notifications table for everyone).
- Notes list without content, plus loading a single note (opt-in on the API so older apps keep working). This is a prerequisite for switch-on with large notes.

**Phase 1: foundation + Notes/journal**
Key setup, recovery code, unlock (password + passkey PRF), remembered device, lock on logout, the switch in settings with the "what's covered" list. Notes and journal encrypted, import/export in the app.

**Phase 2: Check-in, Finances, tags/folders**
Row blobs for check-in and finance values, encrypted tag/folder names, client-side sorting.

**Phase 3: Todos, Clipboard text**
Client-side todo parsing and quick add, counts-only reminders, imports in the app.

**Later, optional**
Push with titles, single encrypted calendars/address books (needs a pgsql/DAV change, owner approval required), Telegram write-only entries, sharing encrypted calendars, native widgets (key in Keychain/Keystore, shell repo).

## 6. Users without encryption

Unaffected. On the API, all changes are additive: nullable new columns, wider text columns, new key tables, a setting that defaults to off. Every new rule applies only to users with encryption on. In the app, plaintext rows take the existing code path. The risk is bugs in shared code, so tests have to cover both paths. Crypto helpers are pure and fit `tests/unit/`, and the stores fit `tests/unit/stores/`.

## 7. Open

- PBKDF2 (built in) or Argon2id (WASM dependency, stronger against guessing)? Recommendation: PBKDF2 for v1. Decide before phase 1.
- Calendars under the switch: pick per calendar (proposed, default none) or all-or-nothing with sync dropped. Decide before that phase.
