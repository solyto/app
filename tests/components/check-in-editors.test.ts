import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import ApiService from '$lib/services/ApiService';
import TrackerEditor from '$lib/components/check-in/settings/TrackerEditor.svelte';
import AlertEditor from '$lib/components/settings/alerts/AlertEditor.svelte';
import type { CheckInTracker } from '$lib/types/check_in';
import { renderWithContext } from './helpers/context';
import CheckInContextHarness from './helpers/CheckInContextHarness.svelte';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Tracker editor', () => {
	it('creates the tracker once when "Add tracker" is clicked twice quickly', async () => {
		type Created = Awaited<ReturnType<ApiService['create']>>;
		let answer: (value: Created) => void = () => {};
		const create = vi.spyOn(ApiService.prototype, 'create').mockImplementation(() => new Promise<Created>((resolve) => (answer = resolve)));
		vi.spyOn(ApiService.prototype, 'list').mockResolvedValue({
			data: [{ id: 1, key: null, name: 'Meditated', type: 'yes_no', enabled: true }]
		} as never);
		const onDone = vi.fn();
		renderWithContext(CheckInContextHarness, { component: TrackerEditor, props: { onDone } });

		await fireEvent.input(screen.getByPlaceholderText('e.g. Glasses of water'), { target: { value: 'Meditated' } });
		const add = screen.getByRole('button', { name: 'Add tracker' });
		await fireEvent.click(add);
		await fireEvent.click(add);

		expect(create).toHaveBeenCalledTimes(1);
		answer({ data: { id: 1 } } as Created);
		await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
		expect(create).toHaveBeenCalledTimes(1);
	});
});

describe('Alert editor', () => {
	it('starts with a rule the first tracker offers, so a new alert can be saved', () => {
		const meditated = { id: 7, key: null, name: 'Meditated', type: 'yes_no', icon: null, position: 0, enabled: true, scored: false, values_count: 0 } as CheckInTracker;
		renderWithContext(CheckInContextHarness, { component: AlertEditor, props: { onClose: vi.fn() }, trackers: [meditated] });

		expect(screen.getByRole<HTMLButtonElement>('button', { name: 'New alert' }).disabled).toBe(false);
	});
});
