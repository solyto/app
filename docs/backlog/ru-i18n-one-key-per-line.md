# Backlog: format ru.ts with one key per line

created: 2026-11-17

## What

Reformat `src/lib/i18n/ru.ts` like the other locale files: one key per line,
except the grouped lines that are grouped in every locale. Formatting only.
No key or text changes.

A possible shape:

- A one-off script that walks `ru.ts` section by section and splits every
  line with several `key: 'value'` pairs, unless the matching line in `en.ts`
  holds the same group of keys. Today these are 19 lines, the same in
  en/de/es/fr/it, e.g. the check-in scales `mood_1 … mood_5`,
  `sleep_1 … sleep_5`, `day_today, day_yesterday`.
- The parser must handle commas, quotes and escaped quotes inside values.
- Verify afterwards that the key list and every value are unchanged (e.g.
  import both versions and compare the objects), and run `npm run check`.
- Its own commit, with nothing else in it, so the large diff is easy to
  review and to skip in `git blame` (`.git-blame-ignore-revs`, if used).

## Why

`ru.ts` was added in `9793446` (`feat(i18n): add Russian (ru) localization`)
in a compressed style. It has 233 lines with several keys per line. The other
five locales have 19 each, all of them deliberate groups. ru is also
noticeably shorter: 1,177 lines against ~1,516. Later changes followed the
compressed style in ru, e.g. the budget interval, wealth range and tag keys
(`ru.ts` around line 680), while the other locales got one line per key.

Mixed formatting makes diffs across locales harder to compare and invites
more drift. Found by the owner while reviewing the wealth range job
(2026-11-17): "Consistency is key longterm."

## Out of scope

- The 19 grouped lines that are grouped in all locales. Splitting those
  everywhere is a separate decision.
- Translation content. `docs/I18N.md` covers that.

## Notes

- Until this is done, new ru keys could go on their own lines, to stop the
  drift growing. `docs/I18N.md` could say so, as a one-line rule for the
  translator agent (`docs/agents/translator.md`).
- If a formatter (Prettier) is configured for `src/`, check whether it would
  keep or undo the split, and whether ru.ts is excluded somewhere.
