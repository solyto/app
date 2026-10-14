import { describe, it, expect, vi, afterEach } from 'vitest';
import type ApiServiceClass from '$lib/services/ApiService';

// This file exercises the X-Client-Version header, which depends on
// PUBLIC_VERSION. It mocks the public env per test and re-imports the service
// (the main ApiService.test.ts runs with an empty env).

function jsonResponse(data: unknown, ok = true, status = 200) {
	return {
		ok,
		status,
		json: vi.fn().mockResolvedValue(data),
		blob: vi.fn().mockResolvedValue(new Blob())
	};
}

async function loadApiService(env: Record<string, string> = {}): Promise<typeof ApiServiceClass> {
	vi.resetModules();
	vi.doMock('$env/dynamic/public', () => ({ env }));
	return (await import('$lib/services/ApiService')).default;
}

function headersOf(fetchMock: ReturnType<typeof vi.fn>, call = 0): Record<string, string> {
	return fetchMock.mock.calls[call][1].headers;
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.doUnmock('$env/dynamic/public');
});

describe('X-Client-Version with PUBLIC_VERSION set', () => {
	const env = { PUBLIC_VERSION: '1.2.3' };

	it('is sent on bodyless requests with and without a token', async () => {
		const ApiService = await loadApiService(env);
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
		vi.stubGlobal('fetch', fetchMock);

		await new ApiService('tok').list('/todos');
		await new ApiService().list('/todos');

		expect(headersOf(fetchMock, 0)).toEqual({
			Authorization: 'Bearer tok',
			Accept: 'application/json',
			'X-Client-Version': '1.2.3'
		});
		expect(headersOf(fetchMock, 1)).toEqual({
			Accept: 'application/json',
			'X-Client-Version': '1.2.3'
		});
	});

	it('is sent on JSON body requests with and without a token', async () => {
		const ApiService = await loadApiService(env);
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
		vi.stubGlobal('fetch', fetchMock);

		await new ApiService('tok').create('/todos', {});
		await new ApiService().create('/todos', {});

		expect(headersOf(fetchMock, 0)).toEqual({
			Authorization: 'Bearer tok',
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'X-Client-Version': '1.2.3'
		});
		expect(headersOf(fetchMock, 1)).toEqual({
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'X-Client-Version': '1.2.3'
		});
	});

	it('is sent on form uploads', async () => {
		const ApiService = await loadApiService(env);
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
		vi.stubGlobal('fetch', fetchMock);

		await new ApiService('tok').postFormData('/upload', new FormData());

		expect(headersOf(fetchMock)).toEqual({
			Authorization: 'Bearer tok',
			'X-Client-Version': '1.2.3'
		});
	});

	it('is sent on downloads next to the given Accept type', async () => {
		const ApiService = await loadApiService(env);
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null));
		vi.stubGlobal('fetch', fetchMock);

		await new ApiService('tok').download('/export/7/download', 'application/zip');

		expect(headersOf(fetchMock)).toEqual({
			Authorization: 'Bearer tok',
			Accept: 'application/zip',
			'X-Client-Version': '1.2.3'
		});
	});

	it('is sent again on the 401 recovery retry', async () => {
		const ApiService = await loadApiService(env);
		const service = new ApiService('old');
		service.setUnauthorizedHandler(async () => {
			service.updateAuthToken('new');
			return true;
		});
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse(null, false, 401))
			.mockResolvedValueOnce(jsonResponse({ data: [] }));
		vi.stubGlobal('fetch', fetchMock);

		await service.list('/todos');

		expect(headersOf(fetchMock, 1)).toEqual({
			Authorization: 'Bearer new',
			Accept: 'application/json',
			'X-Client-Version': '1.2.3'
		});
	});
});

describe('X-Client-Version without PUBLIC_VERSION', () => {
	it('is not sent when PUBLIC_VERSION is unset', async () => {
		const ApiService = await loadApiService({});
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
		vi.stubGlobal('fetch', fetchMock);

		await new ApiService('tok').list('/todos');

		expect(headersOf(fetchMock)).not.toHaveProperty('X-Client-Version');
	});

	it('is not sent when PUBLIC_VERSION is empty', async () => {
		const ApiService = await loadApiService({ PUBLIC_VERSION: '' });
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
		vi.stubGlobal('fetch', fetchMock);

		await new ApiService().create('/todos', {});

		expect(headersOf(fetchMock)).not.toHaveProperty('X-Client-Version');
	});
});
