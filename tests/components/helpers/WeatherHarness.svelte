<script lang="ts">
	import type { Component } from 'svelte';
	import { setWeather, type Weather } from '$lib/state/Weather.svelte';

	let {
		component: Inner,
		props = {},
		onReady
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		props?: Record<string, unknown>;
		onReady: (weather: Weather) => void;
	} = $props();

	const weather = setWeather();
	// svelte-ignore state_referenced_locally
	onReady(weather);
</script>

<Inner {...props} />
