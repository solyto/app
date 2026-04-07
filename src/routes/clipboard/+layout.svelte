<script lang="ts">
	import { setClipboard } from '$lib/state/Clipboard.svelte.js';

	setClipboard();

	let { children } = $props();
</script>

{@render children?.()}
