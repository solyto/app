<script lang="ts">
	import type { Component } from 'svelte';
	import type { CheckInType } from '$lib/types/check_in';

	let {
		type,
		label,
		value,
		icon: Icon
	} = $props<{
		type: CheckInType;
		label: string;
		value: number;
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

<div class="flex items-center gap-2.5">
	{#if Icon}
		<Icon
			class="h-3.5 w-3.5 shrink-0 text-c-neutral-4 dark:text-c-neutral-5"
		/>
	{/if}
	<div class="min-w-0 flex-1">
		<div class="mb-0.5 flex items-center justify-between">
			<span class="text-xs text-c-neutral-6 dark:text-c-neutral-4">
				{label}
			</span>
			<span class="text-xs font-medium text-c-neutral-8 dark:text-white">
				{#if isNaN(value)}
					-
				{:else}
					{value.toFixed(2)}
				{/if}
			</span>
		</div>
		<div class="h-1 overflow-hidden rounded-full bg-c-neutral-1 dark:bg-s-dark-3">
			<div
				class="h-full rounded-full transition-all duration-300 {barColor()}"
				style="width: {isNaN(value) ? 0 : (value / 5) * 100}%"
			></div>
		</div>
	</div>
</div>
