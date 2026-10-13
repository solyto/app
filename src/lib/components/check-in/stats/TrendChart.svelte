<script lang="ts">
	import type { Component } from 'svelte';
	import SmoothLineChart from '$lib/components/charts/SmoothLineChart.svelte';

	let {
		label,
		categories,
		values,
		icon: Icon
	} = $props<{
		label: string;
		categories: string[];
		values: number[];
		icon: Component<{ class?: string }> | null;
	}>();
</script>

{#if categories.length >= 2}
	<div>
		<div class="mb-2 flex items-center gap-3 px-1">
			{#if Icon}
				<Icon class="size-5 text-c-neutral-6 dark:text-c-neutral-4" />
			{/if}
			<p class="text-xl font-semibold text-c-heading dark:text-c-primary">
				{label}
			</p>
		</div>
		<div class="rounded-xl bg-c-bg-surface p-4 shadow-sm">
			<SmoothLineChart
				{categories}
				{values}
				min={1}
				max={5}
				filled={true}
				class="h-56"
			/>
		</div>
	</div>
{/if}
