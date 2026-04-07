import { getContext, setContext } from 'svelte';
import { themes, type Theme } from '$lib/config/themes';

export class ThemeState {
	theme = $state<Theme>(themes[0]);
	link: HTMLLinkElement | null = null;
	mediaQuery: MediaQueryList | null = null;
	darkListener: ((e: MediaQueryListEvent) => void) | null = null;

	load(): void {
		const saved = localStorage.getItem('theme') ?? 'default';
		this.apply(themes.find((t) => t.id === saved) ?? themes[0]);
	}

	setTheme(theme: Theme): void {
		localStorage.setItem('theme', theme.id);
		this.apply(theme);
	}

	apply(theme: Theme): void {
		this.theme = theme;

		this.link?.remove();
		if (theme.id !== 'default') {
			this.link = document.createElement('link');
			this.link.rel = 'stylesheet';
			this.link.href = `/themes/${theme.id}/${theme.id}.css`;
			document.head.appendChild(this.link);
		}

		if (this.mediaQuery && this.darkListener) {
			this.mediaQuery.removeEventListener('change', this.darkListener);
			this.darkListener = null;
		}

		if (theme.supportsDarkMode) {
			this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			this.darkListener = (e) => this.applyDark(e.matches);
			this.mediaQuery.addEventListener('change', this.darkListener);
			this.applyDark(this.mediaQuery.matches);
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	applyDark(dark: boolean): void {
		document.documentElement.classList.toggle('dark', dark);
	}
}

const THEME_KEY = Symbol('SOLYTO_THEME');

export function setThemeState(): ThemeState {
	return setContext(THEME_KEY, new ThemeState());
}

export function getThemeState(): ThemeState {
	return getContext<ThemeState>(THEME_KEY);
}
