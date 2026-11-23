import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import type { Finances } from '$lib/state/Finances.svelte';
import BudgetField from '$lib/components/finances/BudgetField.svelte';
import WealthFieldDisplay from '$lib/components/finances/WealthField.svelte';
import { renderWithContext } from './helpers/context';
import FinancesHarness from './helpers/FinancesHarness.svelte';
import { budget as budgetItem, wealthField } from '../unit/helpers/factories';

const budget = budgetItem();
const wealth = wealthField();

function renderRow(component: typeof BudgetField | typeof WealthFieldDisplay, props: Record<string, unknown>): Finances {
	let finances: Finances | null = null;
	renderWithContext(FinancesHarness, { component, props: { sectionTotal: 1000, onOpenHistory: vi.fn(), ...props }, onReady: (f: Finances) => (finances = f) });
	return finances!;
}

const rows = [
	['budget item', BudgetField, { budget }, 'deleteBudget', 'Rent'],
	['wealth item', WealthFieldDisplay, { wealth }, 'deleteWealthField', 'Savings']
] as const;

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Finance rows', () => {
	it.each(rows)('asks before deleting a %s', async (_, component, props, method, title) => {
		const finances = renderRow(component, props);
		const remove = vi.spyOn(finances, method).mockResolvedValue(true);

		await fireEvent.click(screen.getByLabelText(`Delete ${title}`));
		expect(remove).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
		expect(remove).toHaveBeenCalledTimes(1);
	});

	it.each(rows)('opens the history of a %s from its labelled edit button', async (_, component, props, __, title) => {
		const onOpenHistory = vi.fn();
		renderRow(component, { ...props, onOpenHistory });

		await fireEvent.click(screen.getByLabelText(`Edit ${title}`));

		expect(onOpenHistory).toHaveBeenCalledTimes(1);
	});
});
