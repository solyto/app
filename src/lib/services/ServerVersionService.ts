import { CLIENT_VERSION, getApiUrl } from '$lib/config/platform';
import { compareVersions, isOlderVersion } from '$lib/helpers/VersionHelper';
import LocalStorageService from '$lib/services/LocalStorageService';

const LS_SEEN_KEY = 'server_version_notice_seen';
const LS_SERVER_VERSION_KEY = 'server_version';

// Servers before this version reject X-Client-Version in their CORS preflight.
const MIN_SERVER_VERSION_FOR_CLIENT_HEADER = '1.1.0';

interface StoredServerVersion {
	apiUrl: string;
	version: string;
}

export async function fetchServerVersion(baseUrl: string): Promise<string | null> {
	try {
		const res = await fetch(`${baseUrl}/api/v1/health`);
		if (!res.ok) return null;
		const data = await res.json();
		const health = data?.data ?? data;
		return typeof health?.version === 'string' ? health.version : null;
	} catch {
		return null;
	}
}

export async function checkServerVersion(): Promise<string | null> {
	if (!CLIENT_VERSION) return null;

	const apiUrl = getApiUrl();
	const version = await fetchServerVersion(apiUrl);
	if (!version) return null;

	const stored: StoredServerVersion = { apiUrl, version };
	new LocalStorageService().setJson(LS_SERVER_VERSION_KEY, stored);
	return version;
}

export function storedServerVersion(): string | null {
	const stored = new LocalStorageService().getJson(LS_SERVER_VERSION_KEY) as Partial<StoredServerVersion> | null;
	if (!stored || stored.apiUrl !== getApiUrl() || typeof stored.version !== 'string') return null;

	return stored.version;
}

export function acceptsClientVersionHeader(serverVersion: string | null): boolean {
	if (!serverVersion) return false;

	const comparison = compareVersions(serverVersion, MIN_SERVER_VERSION_FOR_CLIENT_HEADER);
	return comparison !== null && comparison >= 0;
}

export function outdatedServerVersionToAnnounce(serverVersion: string): string | null {
	if (!CLIENT_VERSION || !isOlderVersion(serverVersion, CLIENT_VERSION)) return null;

	const ls = new LocalStorageService();
	const pair = `${serverVersion}|${CLIENT_VERSION}`;
	if (ls.get(LS_SEEN_KEY) === pair) return null;

	ls.set(LS_SEEN_KEY, pair);
	return serverVersion;
}
