<script lang="ts">
	import { onMount } from 'svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getTags, setTags } from '$lib/state/Tags.svelte.js';
	import { getMovieLibrary, setMovieLibrary } from '$lib/state/MovieLibrary.svelte.js';

	setMovieLibrary();
	setTags();

	const loadingIndicator = getLoadingIndicator();
	const library = getMovieLibrary();
	const tags = getTags();

	onMount(async () => {
		loadingIndicator.start();
		await Promise.all([library.load(), tags.load()]);
		loadingIndicator.stop();
	});

	let { children } = $props();
</script>

{@render children?.()}
