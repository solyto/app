import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ApiService from '$lib/services/ApiService';
import type { Budget } from '$lib/types/finance';
import type { Finances } from '$lib/state/Finances.svelte';
import type { Tags } from '$lib/state/Tags.svelte';
import BudgetPage from '../../src/routes/finances/budget/+page.svelte';
import { renderWithContext } from './helpers/context';
import FinancesHarness from './helpers/FinancesHarness.svelte';

const rent: Budget = { id: 1, title: 'Rent', type: 'expense', value: 900, tags: [], created_at: '', updated_at: '' };

async function openRentHistory(): Promise<Finances> {
	vi.spyOn(ApiService.prototype, 'list').mockResolvedValue({ data: [] });
	let finances: Finances | null = null;
	renderWithContext(FinancesHarness, {
		component: BudgetPage,
		onReady: (f: Finances, tags: Tags) => {
			finances = f;
			tags.tags = [{ id: 3, name: 'Home', color: '#000', created_at: '', updated_at: '' }];
		}
	});
	finances!.expenses = [rent];
	finances!.budgetLoaded = true;

	await fireEvent.click(await screen.findByText('Rent'));
	await screen.findByLabelText('Interval');
	return finances!;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Budget page history', () => {
	it('shows the budget as the store has it after a reload', async () => {
		const finances = await openRentHistory();

		finances.expenses = [{ ...rent, title: 'Rent and parking' }];

		await waitFor(() => expect(screen.getAllByText('Rent and parking').length).toBeGreaterThan(1));
	});

	it('reloads the budgets after a failed tag change, so the picker shows the saved tags again', async () => {
		const finances = await openRentHistory();
		vi.spyOn(finances, 'updateBudget').mockResolvedValue(false);
		const reload = vi.spyOn(finances, 'loadIncome').mockResolvedValue();

		await userEvent.setup().type(screen.getByRole('searchbox'), 'Home{Enter}');

		await waitFor(() => expect(finances.updateBudget).toHaveBeenCalledWith(rent, { tags: [3] }));
		expect(reload).toHaveBeenCalledTimes(1);
	});
});
