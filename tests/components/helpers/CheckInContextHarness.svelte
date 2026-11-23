<script lang="ts">
	import type { Component } from 'svelte';
	import type { CheckInTracker } from '$lib/types/check_in';
	import { setCheckInData } from '$lib/state/CheckInData.svelte';
	import { setGoals } from '$lib/state/Goals.svelte';
	import { setAlerts } from '$lib/state/Alerts.svelte';

	let {
		component: Inner,
		props = {},
		trackers = []
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		props?: Record<string, unknown>;
		trackers?: CheckInTracker[];
	} = $props();

	const checkInData = setCheckInData();
	setGoals();
	setAlerts();
	// svelte-ignore state_referenced_locally
	checkInData.trackers = trackers;
</script>

<Inner {...props} />
