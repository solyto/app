<script lang="ts">
	import { setPlanner } from '$lib/state/Planner.svelte';

	setPlanner();

	let { children } = $props();
</script>

{@render children?.()}
