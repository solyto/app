import { getContext, setContext } from 'svelte';
import { page } from '$app/state';

export type HelpSection =
	| 'home'
	| 'todos'
	| 'calendar'
	| 'notes'
	| 'libraries'
	| 'contacts'
	| 'checkIn'
	| 'assistants'
	| 'finances'
	| 'feeds'
	| 'clipboard'
	| 'timeTracking'
	| 'settings'
	| 'profile'
	| 'dev_requests';

export class Help {
	visible = $state<boolean>(false);

	constructor() {}

	handleF1(): void {
		this.visible = !this.visible;
	}

	close(): void {
		this.visible = false;
	}

	getCurrentSection(): HelpSection {
		const pathname = page.url.pathname;

		const routes: Array<[string, HelpSection]> = [
			['/', 'home'],
			['/todos', 'todos'],
			['/calendar', 'calendar'],
			['/notes', 'notes'],
			['/libraries', 'libraries'],
			['/contacts', 'contacts'],
			['/check-in', 'checkIn'],
			['/assistants', 'assistants'],
			['/time-tracking', 'timeTracking'],
			['/finances', 'finances'],
			['/feeds', 'feeds'],
			['/clipboard', 'clipboard'],
			['/settings', 'settings'],
			['/profile', 'profile'],
			['/dev-requests', 'dev_requests']
		];

		for (const [path, section] of routes) {
			if (path === '/' ? pathname === path : pathname.startsWith(path)) {
				return section;
			}
		}

		return 'home';
	}
}

const HELP_KEY = Symbol('SOLYTO_HELP');

export function setHelp(): Help {
	return setContext(HELP_KEY, new Help());
}

export function getHelp(): Help {
	return getContext<Help>(HELP_KEY);
}
