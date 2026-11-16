<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { getClipboard } from '$lib/state/Clipboard.svelte';
	import type { ClipboardEntry } from '$lib/types/clipboard';

	let { entry }: { entry: ClipboardEntry } = $props();

	const clipboard = getClipboard();

	let src = $state<string | null>(null);
	let destroyed = false;

	onMount(async () => {
		const blob = await clipboard.getImage(entry);
		if (!blob || destroyed) return;
		src = URL.createObjectURL(blob);
	});

	onDestroy(() => {
		destroyed = true;
		if (src) URL.revokeObjectURL(src);
	});
</script>

{#if src}
	<img {src} alt="Clipboard" class="block max-h-64 rounded-md" />
{:else}
	<div class="h-32 w-48 rounded-md bg-c-neutral-2 dark:bg-s-dark-2"></div>
{/if}
