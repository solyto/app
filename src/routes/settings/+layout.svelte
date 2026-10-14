<script lang="ts">
	import { setTags } from '$lib/state/Tags.svelte';
	import { setTodos } from '$lib/state/Todos.svelte';
	import { setPlugins } from '$lib/state/Plugins.svelte';

	setTags();
	setTodos();
	setPlugins();

	let { children } = $props();
</script>

{@render children?.()}
