<script lang="ts">
	import type { Component } from 'svelte';
	import { setTags, type Tags } from '$lib/state/Tags.svelte';

	let {
		component: Inner,
		props = {},
		onReady
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		props?: Record<string, unknown>;
		onReady?: (tags: Tags) => void;
	} = $props();

	const tags = setTags();
	// svelte-ignore state_referenced_locally
	onReady?.(tags);
</script>

<Inner {...props} />
