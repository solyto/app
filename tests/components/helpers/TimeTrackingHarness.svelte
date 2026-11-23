<script lang="ts">
	import type { Component } from 'svelte';
	import { setTimeTracking, type TimeTracking } from '$lib/state/TimeTracking.svelte';

	let {
		component: Inner,
		props = {},
		onReady
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		props?: Record<string, unknown>;
		onReady: (timeTracking: TimeTracking) => void;
	} = $props();

	const timeTracking = setTimeTracking();
	// svelte-ignore state_referenced_locally
	onReady(timeTracking);
</script>

<Inner {...props} />
