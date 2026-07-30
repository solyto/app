<script lang="ts">
	import { onMount } from 'svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getVideoLibrary, setVideoLibrary } from '$lib/state/VideoLibrary.svelte';

	setVideoLibrary();

	const loadingIndicator = getLoadingIndicator();
	const library = getVideoLibrary();

	onMount(async () => {
		loadingIndicator.start();
		await library.load();
		loadingIndicator.stop();
	});

	let { children } = $props();
</script>

{@render children?.()}
