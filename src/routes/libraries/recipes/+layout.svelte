<script lang="ts">
	import { onMount } from 'svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { setTags } from '$lib/state/Tags.svelte.js';
	import { getRecipeLibrary, setRecipeLibrary } from '$lib/state/RecipeLibrary.svelte.js';

	setRecipeLibrary();
	setTags();

	const loadingIndicator = getLoadingIndicator();
	const library = getRecipeLibrary();

	onMount(async () => {
		loadingIndicator.start();
		await library.load();
		loadingIndicator.stop();
	});

	let { children } = $props();
</script>

{@render children?.()}
