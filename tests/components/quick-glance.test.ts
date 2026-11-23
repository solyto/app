import { describe, it, expect, vi, afterEach } from 'vitest';
import { waitFor } from '@testing-library/svelte';
import ApiService from '$lib/services/ApiService';
import { renderWithContext } from './helpers/context';
import QuickGlanceHarness from './helpers/QuickGlanceHarness.svelte';

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('QuickGlance', () => {
	it('loads the trackers once, 30 days of values, the goals and no check-in settings', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date(2026, 10, 20));
		const list = vi.spyOn(ApiService.prototype, 'list').mockResolvedValue({ data: [] });
		const get = vi.spyOn(ApiService.prototype, 'get').mockResolvedValue(null);

		renderWithContext(QuickGlanceHarness);

		const listed = (pattern: RegExp) => list.mock.calls.filter(([url]) => pattern.test(url));
		await waitFor(() => expect(listed(/\/goals$/)).toHaveLength(1));
		expect(listed(/\/check-in\/trackers$/)).toHaveLength(1);
		expect(listed(/\/check-in\/values/).map(([url]) => url)).toEqual([expect.stringMatching(/\/check-in\/values\?from=2026-10-21$/)]);
		expect(get.mock.calls.filter(([url]) => url.includes('/settings/check-in'))).toEqual([]);
	});
});
