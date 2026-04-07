<script lang="ts">
	import { getMusicLibrary, setMusicLibrary } from '$lib/state/MusicLibrary.svelte.js';
	import { onMount } from 'svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';

	setMusicLibrary();

	const loadingIndicator = getLoadingIndicator();
	const library = getMusicLibrary();

	onMount(async () => {
		loadingIndicator.start();
		await library.load();
		loadingIndicator.stop();
	});

	let { children } = $props();
</script>

{@render children?.()}
