<script lang="ts">
	import { onMount } from 'svelte';
	import { setTags } from '$lib/state/Tags.svelte';
	import { setTodos } from '$lib/state/Todos.svelte';
	import { setPlugins } from '$lib/state/Plugins.svelte';
	import { getIntegrations } from '$lib/state/Integrations.svelte';

	setTags();
	setTodos();
	setPlugins();

	const integrations = getIntegrations();

	onMount(() => {
		integrations.load();
	});

	let { children } = $props();
</script>

{@render children?.()}
