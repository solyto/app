<!--suppress CssUnusedSymbol -->
<script lang="ts">
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';

	const loadingIndicator = getLoadingIndicator();

	let active = $derived(loadingIndicator.active);
	let progress = $derived(loadingIndicator.progress);
	let heightClass = 'h-[3px]';
	let colorClass = 'bg-c-btn';
</script>

<div class="pointer-events-none fixed top-0 right-0 left-0 z-50">
	{#if active}
		<div class={`relative ${heightClass}`}>
			{#if progress === null}
				<div class={`absolute inset-0 overflow-hidden ${heightClass}`}>
					<div class={`absolute inset-0 ${heightClass} ${colorClass} opacity-20`}></div>
					<div class={`absolute top-0 ${heightClass} ${colorClass} indeterminate`}></div>
				</div>
			{:else}
				<div
					class={`${heightClass} ${colorClass} transition-[width] duration-300 ease-out`}
					style={`width: ${Math.min(100, Math.max(0, progress * 100)).toFixed(1)}%`}
				></div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.indeterminate {
		width: 20%;
		left: -20%;
		animation: loading-bar 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}
	@keyframes loading-bar {
		0% {
			left: -20%;
			width: 20%;
		}
		50% {
			left: 50%;
			width: 30%;
		}
		100% {
			left: 100%;
			width: 15%;
		}
	}
</style>
