import { page } from '$app/state';
import { navItems, type FeatureType } from '$lib/config/navigation';

export function getPageSlug(): string {
	return page.url.pathname.substring(1).split('/')[0] || 'home';
}

export function getPageFeature(): FeatureType | null {
	return navItems[getPageSlug()]?.featureFlag ?? null;
}
