<script lang="ts">
	import { setFriends } from '$lib/state/Friends.svelte.js';

	setFriends();

	let { children } = $props();
</script>

{@render children?.()}
