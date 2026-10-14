# Backlog: 24 Remove the OpenAI API key setting

created: 2026-10-14

## What

The API (`solyto/api` `cea37f0`) removed `PUT users/me/settings/openai-api-key` and the `ai_enabled` and `openai_api_key` fields from user settings. Remove the frontend side:

- `apiRoutes.users.settings.updateOpenaiApiKey` (`src/lib/config/apiRoutes.ts:35`)
- `Auth.setOpenaiApiKey` (`src/lib/state/Auth.svelte.ts:410`)
- `ai_enabled` and `openai_api_key` in `src/lib/types/auth.ts:19,21`
- `src/lib/components/settings/ConfigureAiTokens.svelte` (no importer found)
- the `openai_token` translation key in `types/translation.ts` and all four i18n files, if nothing else uses it

## Why

The route returns 404 after the API deploy, and the fields no longer exist. The key was stored in plain text and never used. The AI plugin (backlog 25) replaces it.

## Out of scope

The AI plugin settings (backlog 25).

## Notes

Breaking: the dead code fails silently once the API is deployed. Afterwards grep for `openai`, `ai_enabled` and `ConfigureAiTokens`; no hits should remain. Safety: `check`, `lint`, tests.
