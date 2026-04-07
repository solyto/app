<script lang="ts">
	import { getCheckInData } from '$lib/state/CheckInData.svelte.js';
	import { onMount } from 'svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import Averages from '$lib/components/check-in/stats/Averages.svelte';
	import SportsPerWeek from '$lib/components/check-in/stats/SportsPerWeek.svelte';

	const checkInData = getCheckInData();
	const loadingIndicator = getLoadingIndicator();

	let loaded = $state<boolean>(false);

	onMount(async () => {
		loadingIndicator.start();
		await checkInData.load();
		loadingIndicator.stop();
		loaded = true;
	});
</script>

{#if loaded}
	<div class="flex flex-col gap-4">
		<Averages data={checkInData.data} activeTrackers={checkInData.activeTrackers} />
		{#if checkInData.activeTrackers.includes('sports')}
			<SportsPerWeek data={checkInData.data} />
		{/if}
	</div>
{/if}
