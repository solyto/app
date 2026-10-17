import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

const lsStore = new Map<string, string>();

function healthResponse(version: unknown, ok = true) {
	return {
		ok,
		json: vi.fn().mockResolvedValue({ success: true, data: { app: 'solyto', version }, app: 'solyto', version })
	};
}

async function loadService(env: Record<string, string> = {}) {
	vi.resetModules();
	vi.doMock('$env/dynamic/public', () => ({ env }));
	vi.doMock('$app/environment', () => ({ browser: true, dev: false }));
	vi.doMock('$lib/services/LocalStorageService', () => ({
		default: class {
			get = (key: string) => lsStore.get(key) ?? null;
			set = (key: string, value: string) => lsStore.set(key, value);
			getJson = (key: string) => (lsStore.has(key) ? JSON.parse(lsStore.get(key) as string) : null);
			setJson = (key: string, value: unknown) => lsStore.set(key, JSON.stringify(value));
			destroy = (key: string) => lsStore.delete(key);
		}
	}));
	return import('$lib/services/ServerVersionService');
}

beforeEach(() => {
	lsStore.clear();
	vi.stubGlobal('window', { location: { hostname: 'my.solyto.app' } });
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.doUnmock('$env/dynamic/public');
	vi.doUnmock('$app/environment');
	vi.doUnmock('$lib/services/LocalStorageService');
});

describe('fetchServerVersion', () => {
	it('requests health without custom headers so old servers pass CORS', async () => {
		const { fetchServerVersion } = await loadService();
		const fetchMock = vi.fn().mockResolvedValue(healthResponse('1.0.15'));
		vi.stubGlobal('fetch', fetchMock);

		expect(await fetchServerVersion('https://example.org')).toBe('1.0.15');
		expect(fetchMock).toHaveBeenCalledWith('https://example.org/api/v1/health');
	});

	it('returns null when the server is unreachable or answers badly', async () => {
		const { fetchServerVersion } = await loadService();

		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
		expect(await fetchServerVersion('https://example.org')).toBeNull();

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(healthResponse('1.0.15', false)));
		expect(await fetchServerVersion('https://example.org')).toBeNull();

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(healthResponse(undefined)));
		expect(await fetchServerVersion('https://example.org')).toBeNull();
	});
});

describe('checkServerVersion', () => {
	it('remembers the reported version for the configured server', async () => {
		const { checkServerVersion, storedServerVersion } = await loadService({ PUBLIC_VERSION: '1.1.0' });
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(healthResponse('1.1.0')));

		expect(await checkServerVersion()).toBe('1.1.0');
		expect(storedServerVersion()).toBe('1.1.0');
	});

	it('keeps the stored version when the server does not answer', async () => {
		const { checkServerVersion, storedServerVersion } = await loadService({ PUBLIC_VERSION: '1.1.0' });

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(healthResponse('1.1.0')));
		await checkServerVersion();

		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
		expect(await checkServerVersion()).toBeNull();
		expect(storedServerVersion()).toBe('1.1.0');
	});

	it('does not check at all without PUBLIC_VERSION', async () => {
		const { checkServerVersion } = await loadService();
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		expect(await checkServerVersion()).toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('storedServerVersion', () => {
	it('ignores a version stored for a different server', async () => {
		lsStore.set('server_version', JSON.stringify({ apiUrl: 'https://other.example.org', version: '1.1.0' }));
		const { storedServerVersion } = await loadService({ PUBLIC_VERSION: '1.1.0' });

		expect(storedServerVersion()).toBeNull();
	});

	it('returns null when nothing is stored', async () => {
		const { storedServerVersion } = await loadService({ PUBLIC_VERSION: '1.1.0' });

		expect(storedServerVersion()).toBeNull();
	});
});

describe('acceptsClientVersionHeader', () => {
	it('accepts servers from 1.1.0 on', async () => {
		const { acceptsClientVersionHeader } = await loadService();

		expect(acceptsClientVersionHeader('1.1.0')).toBe(true);
		expect(acceptsClientVersionHeader('1.2.0')).toBe(true);
		expect(acceptsClientVersionHeader('2.0')).toBe(true);
	});

	it('rejects older, unknown and malformed versions', async () => {
		const { acceptsClientVersionHeader } = await loadService();

		expect(acceptsClientVersionHeader('1.0.15')).toBe(false);
		expect(acceptsClientVersionHeader(null)).toBe(false);
		expect(acceptsClientVersionHeader('')).toBe(false);
		expect(acceptsClientVersionHeader('1.1.0-beta')).toBe(false);
	});
});

describe('outdatedServerVersionToAnnounce', () => {
	it('announces an older server once per server and app version pair', async () => {
		const { outdatedServerVersionToAnnounce } = await loadService({ PUBLIC_VERSION: '1.1.0' });

		expect(outdatedServerVersionToAnnounce('1.0.15')).toBe('1.0.15');
		expect(outdatedServerVersionToAnnounce('1.0.15')).toBeNull();
	});

	it('announces again after the app version changes', async () => {
		lsStore.set('server_version_notice_seen', '1.0.15|1.1.0');
		const { outdatedServerVersionToAnnounce } = await loadService({ PUBLIC_VERSION: '1.2.0' });

		expect(outdatedServerVersionToAnnounce('1.0.15')).toBe('1.0.15');
	});

	it('stays quiet when the server is the same or newer', async () => {
		const { outdatedServerVersionToAnnounce } = await loadService({ PUBLIC_VERSION: '1.1.0' });

		expect(outdatedServerVersionToAnnounce('1.1.0')).toBeNull();
		expect(outdatedServerVersionToAnnounce('1.2.0')).toBeNull();
	});

	it('stays quiet without PUBLIC_VERSION', async () => {
		const { outdatedServerVersionToAnnounce } = await loadService();

		expect(outdatedServerVersionToAnnounce('1.0.15')).toBeNull();
	});
});
