<script lang="ts">
	import { setTodos } from '$lib/state/Todos.svelte.js';
	import { setTags } from '$lib/state/Tags.svelte.js';

	setTodos();
	setTags();

	let { children } = $props();
</script>

{@render children?.()}
