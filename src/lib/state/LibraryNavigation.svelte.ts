import type { LibraryType } from '$lib/types/library';
import { getContext, setContext, type Component } from 'svelte';
import { page } from '$app/state';
import { urls } from '$lib/config/urls';
import IconMusic from '$lib/icons/lucide/eighth-notes.svelte';
import IconBook from '$lib/icons/lucide/book.svelte';
import IconClapperboard from '$lib/icons/lucide/clapperboard.svelte';
import IconGamepad2 from '$lib/icons/lucide/gamepad-2.svelte';
import IconLink from '$lib/icons/lucide/link.svelte';
import IconQuote from '$lib/icons/lucide/quote.svelte';
import IconCookingPot from '$lib/icons/lucide/cooking-pot.svelte';
import IconLeaf from '$lib/icons/lucide/leaf.svelte';

export const navigationItems: { type: LibraryType; url: `/libraries/${LibraryType}`; icon: Component }[] = [
	{ type: 'music', url: urls.musicLibrary, icon: IconMusic },
	{ type: 'books', url: urls.bookLibrary, icon: IconBook },
	{ type: 'movies', url: urls.movieLibrary, icon: IconClapperboard },
	{ type: 'games', url: urls.gameLibrary, icon: IconGamepad2 },
	{ type: 'links', url: urls.linkLibrary, icon: IconLink },
	{ type: 'quotes', url: urls.quoteLibrary, icon: IconQuote },
	{ type: 'recipes', url: urls.recipeLibrary, icon: IconCookingPot },
	{ type: 'plants', url: urls.plantLibrary, icon: IconLeaf }
];

export class LibraryNavigation {
	activeLibrary = $state<LibraryType | null>(null);

	constructor() {
		this.activeLibrary = this.getLibraryType();
	}

	getLibraryType(): LibraryType | null {
		if (page.url.pathname.includes('music')) return 'music';
		if (page.url.pathname.includes('books')) return 'books';
		if (page.url.pathname.includes('links')) return 'links';
		if (page.url.pathname.includes('quotes')) return 'quotes';
		if (page.url.pathname.includes('recipes')) return 'recipes';
		if (page.url.pathname.includes('movies')) return 'movies';
		if (page.url.pathname.includes('games')) return 'games';
		if (page.url.pathname.includes('plants')) return 'plants';
		return null;
	}
}

const LIBRARY_NAVIGATION_KEY = Symbol('SOLYTO_LIBRARY_NAVIGATION');

export function setLibraryNavigation(): LibraryNavigation {
	return setContext(LIBRARY_NAVIGATION_KEY, new LibraryNavigation());
}

export function getLibraryNavigation(): LibraryNavigation {
	return getContext<LibraryNavigation>(LIBRARY_NAVIGATION_KEY);
}
