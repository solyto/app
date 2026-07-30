<script lang="ts">
	import { onMount } from 'svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getYoutubeLibrary, setYoutubeLibrary } from '$lib/state/YoutubeLibrary.svelte';

	setYoutubeLibrary();

	const loadingIndicator = getLoadingIndicator();
	const library = getYoutubeLibrary();

	onMount(async () => {
		loadingIndicator.start();
		await library.load();
		loadingIndicator.stop();
	});

	let { children } = $props();
</script>

{@render children?.()}
