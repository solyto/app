import { desktopOrder, mobileDefaultOrder, pinnedNavItem, type FeatureType } from '$lib/config/navigation';
import type { NavigationSettings } from '$lib/types/navigation';

type LegacyNavigationSettings = Partial<Record<FeatureType, boolean>>;

interface StoredNavigationSettings {
	visible: LegacyNavigationSettings;
	desktop?: unknown;
	mobile?: unknown;
}

export default class NavigationSettingsService {
	parse(raw: string, defaults: Record<FeatureType, boolean>): NavigationSettings | null {
		const parsed = JSON.parse(raw) as LegacyNavigationSettings | StoredNavigationSettings | null;

		if (!parsed) {
			return null;
		}

		if (!('visible' in parsed)) {
			return { visible: { ...defaults, ...parsed }, desktop: null, mobile: null };
		}

		return {
			visible: { ...defaults, ...parsed.visible },
			desktop: this.completeOrder(parsed.desktop, desktopOrder),
			mobile: this.completeOrder(parsed.mobile, mobileDefaultOrder)
		};
	}

	build(settings: NavigationSettings): string {
		return JSON.stringify(settings);
	}

	private completeOrder(saved: unknown, defaults: string[]): string[] | null {
		if (!Array.isArray(saved)) {
			return null;
		}

		const known = saved.filter(
			(slug, index) => slug !== pinnedNavItem && defaults.includes(slug) && saved.indexOf(slug) === index
		);
		const missing = defaults.filter((slug) => slug !== pinnedNavItem && !known.includes(slug));

		return [pinnedNavItem, ...known, ...missing];
	}
}
