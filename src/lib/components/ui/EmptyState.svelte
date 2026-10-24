<script lang="ts">
	import { blur } from 'svelte/transition';

	let { title, description = null, py = 0, smallerTitle = false }: { 
		title: string; 
		description?: string | null;
		py?: number | null;
		smallerTitle?: boolean | null;
	} = $props();
</script>

<div class="flex w-full flex-col py-{py}" in:blur={{ duration: 200 }}>
	<div 
		class="tracking-wide text-c-heading dark:text-c-primarytext-left"
		class:text-xl={!smallerTitle}
		class:text-lg={smallerTitle}
	>{title}</div>
	{#if description !== null}
		<p class="mt-2 max-w-sm text-sm leading-relaxed text-c-neutral-5 dark:text-c-neutral-4">{description}</p>
	{/if}
</div>
