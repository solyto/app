import { CLIENT_VERSION, getApiUrl } from '$lib/config/platform';
import { isOlderVersion } from '$lib/helpers/VersionHelper';
import LocalStorageService from '$lib/services/LocalStorageService';

const LS_SEEN_KEY = 'server_version_notice_seen';

// Reads the version a server reports on /health. The request carries no custom
// headers on purpose: servers up to 1.0.15 reject X-Client-Version in their
// CORS preflight, and the check must still reach them.
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

// Returns the server version when it is older than this app and the notice
// for this server/app pair has not been shown yet; marks the pair as seen.
export async function outdatedServerVersionToAnnounce(): Promise<string | null> {
	if (!CLIENT_VERSION) return null;

	const serverVersion = await fetchServerVersion(getApiUrl());
	if (!serverVersion || !isOlderVersion(serverVersion, CLIENT_VERSION)) return null;

	const ls = new LocalStorageService();
	const pair = `${serverVersion}|${CLIENT_VERSION}`;
	if (ls.get(LS_SEEN_KEY) === pair) return null;

	ls.set(LS_SEEN_KEY, pair);
	return serverVersion;
}
