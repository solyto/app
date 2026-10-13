<script lang="ts">
	import type { Component } from 'svelte';
	import type { CheckInType } from '$lib/types/check_in';

	let {
		type,
		label,
		value,
		position,
		icon: Icon
	} = $props<{
		type: CheckInType;
		label: string;
		value: number;
		position: number;
		icon: Component<{ class?: string }> | null;
	}>();

	function getBarColor(): string {
		if (value >= 4) return 'bg-c-success';
		if (value >= 3) return 'bg-c-btn';
		if (value >= 2) return 'bg-c-warning';
		if (value >= 1.5) return 'bg-c-action';
		return 'bg-c-danger';
	}

	function getBarColorFood(): string {
		if (value >= 3.5 && value < 4.5) return 'bg-c-success';
		if (value >= 3) return 'bg-c-btn';
		if (value >= 2) return 'bg-c-warning';
		if (value >= 1.5) return 'bg-c-action';
		return 'bg-c-danger';
	}

	function barColor(): string {
		return type === 'food_amount' ? getBarColorFood() : getBarColor();
	}
</script>

<div class="flex items-center gap-3">
	{#if Icon}
		<div
			class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-c-neutral dark:bg-s-dark-3"
		>
			<Icon class="h-4 w-4 text-c-heading dark:text-c-primary" />
		</div>
	{:else}
		<div
			class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-c-neutral dark:bg-s-dark-3"
		>
			<span class="text-sm text-c-heading dark:text-c-primary"
				>#{position}</span
			>
		</div>
	{/if}
	<div class="min-w-0 flex-1">
		<div class="mb-1 flex items-center justify-between">
			<p class="text-sm font-medium text-c-neutral-7 dark:text-c-neutral-3">
				{label}
			</p>
			<p class="text-sm font-semibold text-c-neutral-9 dark:text-white">
				{#if isNaN(value)}
					-
				{:else}
					{value.toFixed(2)}
				{/if}
			</p>
		</div>
		<div class="h-2 overflow-hidden rounded-full bg-c-neutral-1 dark:bg-s-dark-3">
			<div
				class="h-full rounded-full transition-all duration-300 {barColor()}"
				style="width: {isNaN(value) ? 0 : (value / 5) * 100}%"
			></div>
		</div>
	</div>
</div>
