import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import type { Budget, WealthField } from '$lib/types/finance';
import type { Finances } from '$lib/state/Finances.svelte';
import BudgetField from '$lib/components/finances/BudgetField.svelte';
import WealthFieldDisplay from '$lib/components/finances/WealthField.svelte';
import { renderWithContext } from './helpers/context';
import FinancesHarness from './helpers/FinancesHarness.svelte';

const budget: Budget = { id: 1, title: 'Rent', type: 'expense', value: 900, tags: [], created_at: '', updated_at: '' };
const wealth: WealthField = { id: 2, title: 'Savings', values: [], currentValue: null, created_at: '', updated_at: '' };

function renderRow(component: typeof BudgetField | typeof WealthFieldDisplay, props: Record<string, unknown>): Finances {
	let finances: Finances | null = null;
	renderWithContext(FinancesHarness, { component, props: { sectionTotal: 1000, onOpenHistory: vi.fn(), ...props }, onReady: (f: Finances) => (finances = f) });
	return finances!;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Finance rows', () => {
	it.each([
		['budget item', BudgetField, { budget }, 'deleteBudget', 'Rent'],
		['wealth item', WealthFieldDisplay, { wealth }, 'deleteWealthField', 'Savings']
	] as const)('asks before deleting a %s', async (_, component, props, method, title) => {
		const finances = renderRow(component, props);
		const remove = vi.spyOn(finances, method).mockResolvedValue(true);

		await fireEvent.click(screen.getByLabelText(`Delete ${title}`));
		expect(remove).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
		expect(remove).toHaveBeenCalledTimes(1);
	});
});
