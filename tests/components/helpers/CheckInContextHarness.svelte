<script lang="ts">
	import type { Component } from 'svelte';
	import { setCheckInData } from '$lib/state/CheckInData.svelte';
	import { setGoals } from '$lib/state/Goals.svelte';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let { component: Inner, props = {} }: { component: Component<any>; props?: Record<string, unknown> } = $props();

	setCheckInData();
	setGoals();
</script>

<Inner {...props} />
