import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AverageNumber from '$lib/components/check-in/stats/AverageNumber.svelte';
import Rating from '$lib/components/libraries/shared/Rating.svelte';
import StatisticWidget from '$lib/components/admin/StatisticWidget.svelte';

describe('AverageNumber', () => {
	it('renders the value with two decimals', () => {
		render(AverageNumber, { props: { type: 'mood', value: 3.14159 } });
		expect(screen.getByText('3.14')).toBeInTheDocument();
	});

	it('renders a dash for NaN values', () => {
		render(AverageNumber, { props: { type: 'mood', value: NaN } });
		expect(screen.getByText('-')).toBeInTheDocument();
	});

	it.each([
		[4, 'bg-c-success'],
		[3.5, 'bg-c-btn'],
		[2.5, 'bg-c-warning'],
		[1.75, 'bg-c-action'],
		[1.5, 'bg-c-danger']
	])('colors value %s as %s', (value, expected) => {
		const { container } = render(AverageNumber, { props: { type: 'mood', value } });
		const dot = container.querySelector('.size-4');
		expect(dot?.classList.contains(expected)).toBe(true);
	});

	it('applies the food_amount thresholds for that tracker', () => {
		const success = render(AverageNumber, { props: { type: 'food_amount', value: 4 } });
		expect(success.container.querySelector('.size-4')?.classList.contains('bg-c-success')).toBe(
			true
		);

		const danger = render(AverageNumber, { props: { type: 'food_amount', value: 4.6 } });
		expect(danger.container.querySelector('.size-4')?.classList.contains('bg-c-danger')).toBe(
			true
		);
	});
});

describe('Rating', () => {
	it('renders five stars', () => {
		const { container } = render(Rating, { props: { startRating: 0 } });
		expect(container.querySelectorAll('svg')).toHaveLength(5);
	});

	it('calls onchange with the clicked rating', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const { container } = render(Rating, { props: { startRating: 0, onchange } });
		const stars = container.querySelectorAll('svg');
		await user.click(stars[2]);
		expect(onchange).toHaveBeenCalledWith(3);
	});

	it('highlights up to the current rating', async () => {
		const user = userEvent.setup();
		const { container } = render(Rating, { props: { startRating: 0 } });
		const stars = container.querySelectorAll('svg');
		await user.click(stars[3]);
		expect(stars[3].getAttribute('class')).toContain('text-c-warning');
		expect(stars[4].getAttribute('class')).toContain('text-s-gray-200');
	});
});

describe('StatisticWidget', () => {
	it('renders the label and a human-readable number', () => {
		render(StatisticWidget, { props: { label: 'Users', number: 2500 } });
		expect(screen.getByText('Users')).toBeInTheDocument();
		expect(screen.getByText('2.5K')).toBeInTheDocument();
	});

	it('applies the requested color classes', () => {
		const { container } = render(StatisticWidget, {
			props: { label: 'X', number: 1, color: 'blue' }
		});
		expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
		expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
	});
});
