<script lang="ts">
	import { setDevRequests } from '$lib/state/DevRequests.svelte.js';

	setDevRequests();

	let { children } = $props();
</script>

{@render children?.()}
