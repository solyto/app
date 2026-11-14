import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { FeedImport } from '$lib/state/FeedImport.svelte';
import { NetworkError } from '$lib/services/ApiService';
import { renderWithContext } from './helpers/context';
import FeedImportModalContext from './helpers/FeedImportModalContext.svelte';

const GENERIC_ERROR = 'Something went wrong with the import. Please try again.';

function mockRunningImport(processedAt: (call: number) => number) {
	let call = 0;
	return vi.spyOn(FeedImport.prototype, 'refresh').mockImplementation(async function (this: FeedImport) {
		this.state = { stage: 'running', total: 500, processed: processedAt(call++), feeds: [] };
		return true;
	});
}

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

	it('keeps polling past the stall timeout while the import makes progress', async () => {
		vi.useFakeTimers();
		const refresh = mockRunningImport((call) => Math.min(call, 499));

		renderWithContext(FeedImportModalContext);
		await vi.advanceTimersByTimeAsync(400000);
		const calls = refresh.mock.calls.length;
		await vi.advanceTimersByTimeAsync(1000);

		expect(refresh.mock.calls.length).toBeGreaterThan(calls);
		expect(screen.queryByText(GENERIC_ERROR)).toBeNull();
		expect(screen.getByText(/Importing feeds\.\.\./)).toBeInTheDocument();
	});

	it('stops polling and shows an error once the import makes no progress for 5 minutes', async () => {
		vi.useFakeTimers();
		const refresh = mockRunningImport(() => 10);

		renderWithContext(FeedImportModalContext);
		await vi.advanceTimersByTimeAsync(200000);
		expect(screen.queryByText(GENERIC_ERROR)).toBeNull();

		await vi.advanceTimersByTimeAsync(101000);
		expect(screen.getByText(GENERIC_ERROR)).toBeInTheDocument();

		const calls = refresh.mock.calls.length;
		await vi.advanceTimersByTimeAsync(10000);
		expect(refresh).toHaveBeenCalledTimes(calls);
	});

	it('shows the result when a long import finishes', async () => {
		vi.useFakeTimers();
		let call = 0;
		vi.spyOn(FeedImport.prototype, 'refresh').mockImplementation(async function (this: FeedImport) {
			const finished = call > 350;
			this.state = {
				stage: finished ? 'finished' : 'running',
				total: 500,
				processed: finished ? 500 : call,
				feeds: []
			};
			call++;
			return true;
		});

		renderWithContext(FeedImportModalContext);
		await vi.advanceTimersByTimeAsync(360000);

		expect(screen.getByText('Added (0)')).toBeInTheDocument();
		expect(screen.queryByText(GENERIC_ERROR)).toBeNull();
	});

	it('shows an error with a retry button when the first state request fails', async () => {
		const user = userEvent.setup();
		const refresh = vi
			.spyOn(FeedImport.prototype, 'refresh')
			.mockRejectedValueOnce(new NetworkError(new Error('offline')))
			.mockResolvedValueOnce(false);

		renderWithContext(FeedImportModalContext);

		await user.click(await screen.findByRole('button', { name: 'Try again' }));

		expect(await screen.findByText(/Choose the OPML file/)).toBeInTheDocument();
		expect(screen.queryByText(GENERIC_ERROR)).toBeNull();
		expect(refresh).toHaveBeenCalledTimes(2);
	});

	it('switches to the progress view when an upload hits an import that is already running', async () => {
		const user = userEvent.setup();
		vi.spyOn(FeedImport.prototype, 'refresh')
			.mockResolvedValueOnce(false)
			.mockImplementation(async function (this: FeedImport) {
				this.state = { stage: 'running', total: 4, processed: 1, feeds: [] };
				return true;
			});
		vi.spyOn(FeedImport.prototype, 'upload').mockResolvedValue({ ok: false, status: 409 });

		renderWithContext(FeedImportModalContext);
		const file = new File(['<opml/>'], 'feeds.opml', { type: 'text/xml' });
		await user.upload(await screen.findByLabelText('Select File'), file);

		expect(await screen.findByText('Importing feeds... 1 of 4')).toBeInTheDocument();
		expect(screen.getByText('An import is already running.')).toBeInTheDocument();
	});

	it('clears the already-running message once that import finishes', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		vi.useFakeTimers();
		let call = 0;
		vi.spyOn(FeedImport.prototype, 'refresh').mockImplementation(async function (this: FeedImport) {
			if (call++ === 0) return false;
			const finished = call > 3;
			this.state = { stage: finished ? 'finished' : 'running', total: 4, processed: finished ? 4 : 1, feeds: [] };
			return true;
		});
		vi.spyOn(FeedImport.prototype, 'upload').mockResolvedValue({ ok: false, status: 409 });

		renderWithContext(FeedImportModalContext);
		await vi.advanceTimersByTimeAsync(0);
		const file = new File(['<opml/>'], 'feeds.opml', { type: 'text/xml' });
		await user.upload(screen.getByLabelText('Select File'), file);

		expect(screen.getByText('An import is already running.')).toBeInTheDocument();

		await vi.advanceTimersByTimeAsync(5000);

		expect(screen.getByText('Added (0)')).toBeInTheDocument();
		expect(screen.queryByText('An import is already running.')).toBeNull();
	});
});
