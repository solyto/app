import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { urls } from '$lib/config/urls';
import { getCommandPalette } from '$lib/state/CommandPalette.svelte';
import type { Command } from '$lib/types/command';
import { Todos } from '$lib/state/Todos.svelte';
import { getTranslation } from '$lib/state/Translation.svelte';
import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
import { getNavigation } from '$lib/state/Navigation.svelte';

function navCommand(id: string, title: string, url: string): Command {
	return { id, title, category: 'Navigate', action: () => goto(resolve(url)) };
}

export async function registerCommands(): Promise<void> {
	// All getContext calls must happen before any await — context is cleared after the first suspend.
	const palette = getCommandPalette();
	const ts = getTranslation();
	const nav = getNavigation();
	const notifications = getUiNotifications();
	const todos = new Todos();

	palette.register(navCommand('nav-home', 'Dashboard', urls.home));

	if (nav.features.calendar)     palette.register(navCommand('nav-calendar',      ts.get.nav.calendar,      urls.calendar));
	if (nav.features.todos)        palette.register(navCommand('nav-todos',          ts.get.nav.todos,          urls.todos));
	if (nav.features.notes)        palette.register(navCommand('nav-notes',          ts.get.nav.notes,          urls.notes));
	if (nav.features.libraries) {
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
	if (nav.features.contacts)     palette.register(navCommand('nav-contacts',      ts.get.nav.contacts,      urls.contacts));
	if (nav.features.checkIn)      palette.register(navCommand('nav-check-in',      ts.get.nav.checkIn,       urls.checkIn));
	if (nav.features.finances)     palette.register(navCommand('nav-finances',      ts.get.nav.finances,      urls.finances));
	if (nav.features.timeTracking) palette.register(navCommand('nav-time-tracking', ts.get.nav.timeTracking,  urls.timeTracking));
	if (nav.features.feeds)        palette.register(navCommand('nav-feeds',         ts.get.nav.feeds,         urls.feeds));
	if (nav.features.clipboard)    palette.register(navCommand('nav-clipboard',     ts.get.nav.clipboard,     urls.clipboard));

	palette.register(navCommand('nav-profile',  ts.get.nav.profile,  urls.profile));
	palette.register(navCommand('nav-settings', ts.get.nav.settings, urls.settings));

	if (nav.features.dev_requests) palette.register(navCommand('nav-dev-requests', ts.get.nav.dev_requests, urls.devRequests));

	if (nav.features.todos) {
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
