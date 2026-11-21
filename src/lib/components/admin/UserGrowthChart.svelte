<script lang="ts">
	import type { UserGrowthGroupBy, UserGrowthPoint } from '$lib/types/managed_user';
	import SmoothLineChart from '$lib/components/charts/SmoothLineChart.svelte';

	let {
		points,
		groupBy,
		ongroupby
	}: { points: UserGrowthPoint[]; groupBy: UserGrowthGroupBy; ongroupby: (groupBy: UserGrowthGroupBy) => void } = $props();

	const filters: { key: UserGrowthGroupBy; label: string }[] = [
		{ key: 'year', label: 'By Year' },
		{ key: 'month', label: 'By Month' },
		{ key: 'week', label: 'By Week' },
		{ key: 'day', label: 'By Day' }
	];

	function formatCategory(key: string, group: UserGrowthGroupBy): string {
		switch (group) {
			case 'year':
				return key;
			case 'month': {
				const [y, m] = key.split('-');
				return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', {
					month: 'short',
					year: 'numeric'
				});
			}
			case 'week': {
				const match = key.match(/^(\d{4})-W(\d{2})$/);
				if (match) {
					return `${match[2]}.${match[1]}`;
				}
				return key;
			}
			case 'day': {
				const [y, m, d] = key.split('-');
				return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric'
				});
			}
		}
	}
</script>

<div
	class="rounded-xl border border-c-neutral-1 bg-c-bg-surface p-6 shadow-sm dark:border-s-dark-3"
>
	<div class="mb-4 flex items-center justify-between">
		<h3
			class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5"
		>
			User Growth
		</h3>
		<div class="flex items-center gap-1">
			{#each filters as filter (filter.key)}
				<button
					class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
					class:bg-c-btn={groupBy === filter.key}
					class:text-c-btn-text={groupBy === filter.key}
					class:bg-c-neutral-1={groupBy !== filter.key}
					class:dark:bg-s-dark-3={groupBy !== filter.key}
					onclick={() => ongroupby(filter.key)}
				>
					{filter.label}
				</button>
			{/each}
		</div>
	</div>
	{#key groupBy}
		<SmoothLineChart
			categories={points.map((point) => formatCategory(point.period, groupBy))}
			values={points.map((point) => point.total)}
			filled={true}
			color="var(--color-c-success)"
		/>
	{/key}
</div>
