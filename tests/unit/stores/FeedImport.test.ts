import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedImport } from '$lib/state/FeedImport.svelte';
import { RateLimitedError, NetworkError } from '$lib/services/ApiService';
import type ApiService from '$lib/services/ApiService';
import type { Auth } from '$lib/state/Auth.svelte';
import type { Feeds } from '$lib/state/Feeds.svelte';
import type { FeedImportState } from '$lib/types/feed';
import { apiRoutes } from '$lib/config/apiRoutes';
import { api, auth, resetStoreMocks } from '../setup/storeMocks';

function importState(overrides: Partial<FeedImportState> = {}): FeedImportState {
	return {
		stage: 'parsed',
		total: 1,
		processed: 0,
		feeds: [{ url: 'https://example.com/feed.xml', title: 'Example', already_subscribed: false, status: null }],
		...overrides
	};
}

let feeds: { load: ReturnType<typeof vi.fn> };

function store(): FeedImport {
	return new FeedImport(auth as unknown as Auth, api as unknown as ApiService, feeds as unknown as Feeds);
}

beforeEach(() => {
	resetStoreMocks();
	feeds = { load: vi.fn().mockResolvedValue(undefined) };
});

describe('FeedImport store', () => {
	describe('upload', () => {
		it('sends the file as FormData through postWithStatus to importStart', async () => {
			const state = importState();
			api.postWithStatus.mockResolvedValue({ ok: true, status: 200, data: { data: state } });
			const file = new File(['<opml/>'], 'feeds.opml', { type: 'text/x-opml' });
			const s = store();

			const res = await s.upload(file);

			expect(api.postWithStatus).toHaveBeenCalledTimes(1);
			const [endpoint, body] = api.postWithStatus.mock.calls[0];
			expect(endpoint).toBe(apiRoutes.feeds.importStart);
			expect(body).toBeInstanceOf(FormData);
			expect((body as FormData).get('file')).toBeInstanceOf(File);
			expect(((body as FormData).get('file') as File).name).toBe('feeds.opml');
			expect(res).toEqual({ ok: true, status: 200 });
			expect(s.state).toEqual(state);
		});

		it.each([422, 409])('passes a %d to the caller and keeps the state', async (status) => {
			api.postWithStatus.mockResolvedValue({ ok: false, status, data: null });
			const s = store();

			const res = await s.upload(new File([''], 'feeds.opml'));

			expect(res).toEqual({ ok: false, status });
			expect(s.state).toBeNull();
		});

		it('turns a thrown RateLimitedError into a 429', async () => {
			api.postWithStatus.mockRejectedValue(new RateLimitedError(3600, null));

			const res = await store().upload(new File([''], 'feeds.opml'));

			expect(res).toEqual({ ok: false, status: 429 });
		});

		it('rethrows any other error', async () => {
			api.postWithStatus.mockRejectedValue(new NetworkError(new TypeError('offline')));

			await expect(store().upload(new File([''], 'feeds.opml'))).rejects.toBeInstanceOf(NetworkError);
		});
	});

	describe('select', () => {
		it('posts the urls to importSelect and stores the new state', async () => {
			const state = importState({ stage: 'running', feeds: [{ url: 'https://example.com/feed.xml', title: 'Example', already_subscribed: false, status: 'pending' }] });
			api.postWithStatus.mockResolvedValue({ ok: true, status: 200, data: { data: state } });
			const s = store();

			const res = await s.select(['https://example.com/feed.xml']);

			expect(api.postWithStatus).toHaveBeenCalledWith(apiRoutes.feeds.importSelect, { urls: ['https://example.com/feed.xml'] });
			expect(res).toEqual({ ok: true, status: 200 });
			expect(s.state).toEqual(state);
		});

		it('passes a failed status to the caller', async () => {
			api.postWithStatus.mockResolvedValue({ ok: false, status: 409, data: null });

			expect(await store().select(['https://example.com/feed.xml'])).toEqual({ ok: false, status: 409 });
		});
	});

	describe('refresh', () => {
		it('reloads the feeds once when the stage goes from running to finished', async () => {
			const s = store();
			api.get.mockResolvedValueOnce({ data: importState({ stage: 'running' }) });
			api.get.mockResolvedValueOnce({ data: importState({ stage: 'finished' }) });
			api.get.mockResolvedValueOnce({ data: importState({ stage: 'finished' }) });

			await s.refresh();
			await s.refresh();
			await s.refresh();

			expect(api.get).toHaveBeenCalledWith(apiRoutes.feeds.importState, null);
			expect(feeds.load).toHaveBeenCalledTimes(1);
		});

		it('does not reload the feeds when the import is finished from the start', async () => {
			const s = store();
			api.get.mockResolvedValue({ data: importState({ stage: 'finished' }) });

			expect(await s.refresh()).toBe(true);
			expect(s.state?.stage).toBe('finished');
			expect(feeds.load).not.toHaveBeenCalled();
		});

		it('reports a missing state and keeps the previous one', async () => {
			const s = store();
			api.get.mockResolvedValueOnce({ data: importState({ stage: 'running' }) });
			await s.refresh();

			api.get.mockResolvedValueOnce(null);

			expect(await s.refresh()).toBe(false);
			expect(s.state?.stage).toBe('running');
		});
	});

	it('reset clears the state', async () => {
		const s = store();
		api.get.mockResolvedValue({ data: importState() });
		await s.refresh();

		s.reset();

		expect(s.state).toBeNull();
	});
});
