import { setContext, getContext } from 'svelte';
import { browser } from '$app/environment';

const STORAGE_KEY = 'cookie_consent_acknowledged';

export class CookieConsent {
	acknowledged = $state<boolean>(true);

	constructor() {
		if (browser) {
			this.acknowledged = localStorage.getItem(STORAGE_KEY) === 'true';
		}
	}

	acknowledge(): void {
		this.acknowledged = true;
		if (browser) {
			localStorage.setItem(STORAGE_KEY, 'true');
		}
	}
}

const COOKIE_CONSENT_KEY = Symbol('SOLYTO_COOKIE_CONSENT');

export function setCookieConsent(): CookieConsent {
	return setContext(COOKIE_CONSENT_KEY, new CookieConsent());
}

export function getCookieConsent(): CookieConsent {
	return getContext<CookieConsent>(COOKIE_CONSENT_KEY);
}
