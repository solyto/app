import { env } from '$env/dynamic/public';
import { browser, dev } from '$app/environment';
import type { Platform } from '$lib/types/platform';
import LocalStorageService from '$lib/services/LocalStorageService';

export const PLATFORM: Platform = (() => {
	if (env.PUBLIC_DESKTOP) return 'desktop';
	if (env.PUBLIC_MOBILE) return 'mobile';
	return 'web';
})();

export function getApiUrl(): string {
	return PLATFORM === 'web' ? getPwaApiUrl() : getDesktopMobileApiUrl();
}

export function getPwaApiUrl(): string {
	if (dev) return 'http://localhost:8000';
	if (env.PUBLIC_API_URL) return env.PUBLIC_API_URL;
	if (!browser) return 'https://api.solyto.app';

	const domainMap: Record<string, string> = {
		'app.solyto.de': 'https://api.solyto.de',
		'my.solyto.app': 'https://api.solyto.app'
	};

	return domainMap[window.location.hostname] || 'https://api.solyto.app';
}

export function getDesktopMobileApiUrl(): string {
	const ls = new LocalStorageService();
	return ls.get('custom_api_url') || getPwaApiUrl();
}