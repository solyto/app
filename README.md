# solyto app

Frontend for [solyto.app](https://solyto.app) — a productivity hub that brings tasks, notes, calendars, and personal organization tools into one place. Installable as a PWA on desktop and mobile.

Built with SvelteKit 2, Svelte 5, Tailwind CSS v4, and TypeScript.

## Development

Install dependencies:

```sh
npm install
```

Start the dev server:

```sh
npm run dev
```

Runs on [http://localhost:5173](http://localhost:5173) when using the local Docker setup. Running `npm run dev` directly will use the default Vite port instead.

The easiest way to get the full stack running locally is via the [solyto workspace](https://codeberg.org/solyto/solyto).

## Other commands

```sh
npm run build       # production build
npm run preview     # preview the production build locally
npm run check       # type-check with svelte-check
npm run lint        # prettier + eslint
npm run format      # auto-format
```

## Deployment

Handled via Ansible in [solyto/deployment](https://codeberg.org/solyto/deployment).
