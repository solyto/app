<script lang="ts">
	import { setTables, getTables } from '$lib/state/Tables.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { onMount } from 'svelte';

	setTables();

	const tables = getTables();
	const loadingIndicator = getLoadingIndicator();

	let { children } = $props();

	onMount(async () => {
		loadingIndicator.start();
		await tables.load();
		loadingIndicator.stop();
	});
</script>

{@render children?.()}
