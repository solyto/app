const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function isSameOriginPath(url: string): boolean {
	// Browsers read "//host" and "/\host" as a link to another host.
	return url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\');
}

export function safeHref(url: string | null | undefined): string | undefined {
	if (!url) return undefined;
	if (isSameOriginPath(url)) return url;
	try {
		return SAFE_PROTOCOLS.has(new URL(url).protocol) ? url : undefined;
	} catch {
		return undefined;
	}
}
