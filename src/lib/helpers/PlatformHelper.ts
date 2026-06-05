import type { Platform } from '$lib/types/platform';

export function getPlatform(): Platform {
	if (typeof window !== 'undefined') {
		if ((window as any).Capacitor?.isNativePlatform()) return 'mobile';
		if (navigator.userAgent.includes('Electron')) return 'desktop';
	}
	return 'web';
}