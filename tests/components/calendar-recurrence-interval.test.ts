import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { renderWithContext } from './helpers/context';
import ChooseRecurrenceRuleHarness from './helpers/ChooseRecurrenceRuleHarness.svelte';

const startDate = new Date(2026, 5, 10);

function renderRule(rule: string): void {
	renderWithContext(ChooseRecurrenceRuleHarness, { rule, startDate });
}

function intervalInput(): HTMLInputElement {
	return screen.getByRole('spinbutton') as HTMLInputElement;
}

function typeSelect(): HTMLSelectElement {
	return screen.getAllByRole('combobox')[0] as HTMLSelectElement;
}

async function typeInterval(value: string): Promise<void> {
	await fireEvent.input(intervalInput(), { target: { value } });
}

describe('Recurrence interval', () => {
	it('shows the interval read from the rule', () => {
		renderRule('FREQ=DAILY;INTERVAL=12');

		expect(intervalInput().value).toBe('12');
		expect(screen.getByText('days')).toBeTruthy();
	});

	it.each([
		['weekly', 'weeks'],
		['monthly_date', 'months'],
		['monthly_weekday', 'months'],
		['yearly', 'years']
	])('names the unit of %s as %s', async (type, unit) => {
		renderRule('FREQ=DAILY;INTERVAL=3');

		await fireEvent.change(typeSelect(), { target: { value: type } });

		expect(screen.getByText(unit)).toBeTruthy();
		expect(screen.getByTestId('interval').textContent).toBe('3');
	});

	it('uses the singular for an interval of 1', () => {
		renderRule('FREQ=WEEKLY;BYDAY=WE');

		expect(screen.getByText('week')).toBeTruthy();
	});

	it.each([
		['0', '1'],
		['1500', '999'],
		['', '4']
	])('turns %j into %s on blur', async (typed, expected) => {
		renderRule('FREQ=DAILY;INTERVAL=4');

		await typeInterval(typed);
		await fireEvent.blur(intervalInput());

		expect(screen.getByTestId('interval').textContent).toBe(expected);
		expect(intervalInput().value).toBe(expected);
	});

	it('falls back to the last valid value typed before an empty input', async () => {
		renderRule('FREQ=DAILY;INTERVAL=4');

		await typeInterval('7');
		await typeInterval('');
		await fireEvent.blur(intervalInput());

		expect(screen.getByTestId('interval').textContent).toBe('7');
	});
});
