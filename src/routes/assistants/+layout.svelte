<script lang="ts">
	import { getAssistants, setAssistants } from '$lib/state/Assistants.svelte.js';
	import { onMount } from 'svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';

	setAssistants();

	const assistants = getAssistants();
	const loadingIndicator = getLoadingIndicator();

	onMount(async () => {
		loadingIndicator.start();
		await assistants.load();
		loadingIndicator.stop();
	});

	let { children } = $props();
</script>

{@render children?.()}
