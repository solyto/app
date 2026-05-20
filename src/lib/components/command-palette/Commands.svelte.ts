import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { urls } from '$lib/config/urls';
import { getCommandPalette } from '$lib/state/CommandPalette.svelte';
import type { Command } from '$lib/types/command';
import { Todos } from '$lib/state/Todos.svelte';
import { getTranslation } from '$lib/state/Translation.svelte';
import { getFeatures } from '$lib/state/Features.svelte';
import { getUiNotifications } from '$lib/state/UiNotifications.svelte';

function navCommand(id: string, title: string, url: string): Command {
	return { id, title, category: 'Navigate', action: () => goto(resolve(url)) };
}

export async function registerCommands(): Promise<void> {
	// All getContext calls must happen before any await — context is cleared after the first suspend.
	const palette = getCommandPalette();
	const ts = getTranslation();
	const features = getFeatures();
	const notifications = getUiNotifications();
	const todos = new Todos();

	await features.load();

	palette.register(navCommand('nav-home', 'Dashboard', urls.home));

	if (features.features.calendar)     palette.register(navCommand('nav-calendar',      ts.get.nav.calendar,      urls.calendar));
	if (features.features.todos)        palette.register(navCommand('nav-todos',          ts.get.nav.todos,          urls.todos));
	if (features.features.notes)        palette.register(navCommand('nav-notes',          ts.get.nav.notes,          urls.notes));
	if (features.features.libraries) {
		const lib = ts.get.libraries.navigation;
		palette.register(navCommand('nav-music',   lib.music,   urls.musicLibrary));
		palette.register(navCommand('nav-books',   lib.books,   urls.bookLibrary));
		palette.register(navCommand('nav-movies',  lib.movies,  urls.movieLibrary));
		palette.register(navCommand('nav-games',   lib.games,   urls.gameLibrary));
		palette.register(navCommand('nav-links',   lib.links,   urls.linkLibrary));
		palette.register(navCommand('nav-quotes',  lib.quotes,  urls.quoteLibrary));
		palette.register(navCommand('nav-recipes', lib.recipes, urls.recipeLibrary));
		palette.register(navCommand('nav-plants',  lib.plants,  urls.plantLibrary));
	}
	if (features.features.contacts)     palette.register(navCommand('nav-contacts',      ts.get.nav.contacts,      urls.contacts));
	if (features.features.checkIn)      palette.register(navCommand('nav-check-in',      ts.get.nav.checkIn,       urls.checkIn));
	if (features.features.finances)     palette.register(navCommand('nav-finances',      ts.get.nav.finances,      urls.finances));
	if (features.features.timeTracking) palette.register(navCommand('nav-time-tracking', ts.get.nav.timeTracking,  urls.timeTracking));
	if (features.features.feeds)        palette.register(navCommand('nav-feeds',         ts.get.nav.feeds,         urls.feeds));
	if (features.features.clipboard)    palette.register(navCommand('nav-clipboard',     ts.get.nav.clipboard,     urls.clipboard));

	palette.register(navCommand('nav-profile',  ts.get.nav.profile,  urls.profile));
	palette.register(navCommand('nav-settings', ts.get.nav.settings, urls.settings));

	if (features.features.dev_requests) palette.register(navCommand('nav-dev-requests', ts.get.nav.dev_requests, urls.devRequests));

	if (features.features.todos) {
		await todos.loadCategories();

		palette.register({
			id: 'create-todo',
			title: 'New Todo',
			category: 'Create',
			inputPlaceholder: 'Buy milk #shopping due:tomorrow…',
			execAfterInput: async (input) => {
				const { ok } = await todos.quickCreate(input);
				if (ok) notifications.success('Todo created.');
				else notifications.error('Failed to create todo.');
			}
		});
	}
}
