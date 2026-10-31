<script lang="ts">
	import { fade } from 'svelte/transition';
	import { clickOutside } from '$lib/helpers/ClickHelper';
	import { portalToBody } from '$lib/helpers/PortalHelper';
	import { onMount } from 'svelte';
	import type { TodoCategory } from '$lib/types/todo';

	let { target, categories, onclick, close }: {
		target: HTMLElement;
		categories: TodoCategory[];
		onclick: (id: number) => void;
		close: () => void;
	} = $props();

	let visible = $state<boolean>(false);

	onMount(() => {
		setTimeout(() => {
			visible = true;
		}, 0);
	});
</script>

{#if visible}
	<div
		class="flex flex-col justify-start rounded-lg border-1 border-c-neutral-2 bg-c-bg-modal shadow-md dark:border-s-dark"
		transition:fade
		use:portalToBody={{ target, closeOnScroll: true, onClose: close }}
		use:clickOutside={() => {
			close();
		}}
	>
		{#each categories as category (category.id)}
			<button
				class="cursor-pointer items-center px-4 py-1 text-left text-sm hover:bg-c-neutral dark:hover:bg-s-dark-3"
				onclick={() => {
					onclick(category.id);
					close();
				}}
			>
				<span>{category.title}</span>
			</button>
		{/each}
	</div>
{/if}
