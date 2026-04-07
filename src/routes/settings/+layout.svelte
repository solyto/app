<script lang="ts">
	import { setTags } from '$lib/state/Tags.svelte.js';
	import { setTodos } from '$lib/state/Todos.svelte.js';

	setTags();
	setTodos();

	let { children } = $props();
</script>

{@render children?.()}
