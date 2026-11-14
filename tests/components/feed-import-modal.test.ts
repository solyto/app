import { describe, it, expect, vi, afterEach } from 'vitest';
import { FeedImport } from '$lib/state/FeedImport.svelte';
import { renderWithContext } from './helpers/context';
import FeedImportModalContext from './helpers/FeedImportModalContext.svelte';

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('FeedImportModal', () => {
	it('stops polling the import state once it is unmounted mid-import', async () => {
		vi.useFakeTimers();
		const refresh = vi.spyOn(FeedImport.prototype, 'refresh').mockImplementation(async function (this: FeedImport) {
			this.state = { stage: 'running', total: 2, processed: 1, feeds: [] };
			return true;
		});

		const { unmount } = renderWithContext(FeedImportModalContext);
		await vi.advanceTimersByTimeAsync(0);
		expect(refresh).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1000);
		expect(refresh).toHaveBeenCalledTimes(2);

		unmount();
		await vi.advanceTimersByTimeAsync(10000);

		expect(refresh).toHaveBeenCalledTimes(2);
	});

	it('does not start polling when it is unmounted before the first refresh resolves', async () => {
		vi.useFakeTimers();
		let resolveFirst: (found: boolean) => void = () => {};
		const refresh = vi.spyOn(FeedImport.prototype, 'refresh').mockImplementation(function (this: FeedImport) {
			this.state = { stage: 'running', total: 2, processed: 1, feeds: [] };
			return new Promise<boolean>((resolve) => {
				resolveFirst = resolve;
			});
		});

		const { unmount } = renderWithContext(FeedImportModalContext);
		await vi.advanceTimersByTimeAsync(0);
		expect(refresh).toHaveBeenCalledTimes(1);

		unmount();
		resolveFirst(true);
		await vi.advanceTimersByTimeAsync(10000);

		expect(refresh).toHaveBeenCalledTimes(1);
	});
});
