<script lang="ts">
	import { getLast30Days } from '$lib/helpers/DateHelper';
	import { getViewPoint } from '$lib/state/Viewpoint.svelte.js';
	import { getCheckInData } from '$lib/state/CheckInData.svelte.js';
	import OverviewDesktop from '$lib/components/check-in/overview/OverviewDesktop.svelte';
	import OverviewMobile from '$lib/components/check-in/overview/OverviewMobile.svelte';

	const viewPoint = getViewPoint();
	const checkInData = getCheckInData();

	const dates: Date[] = getLast30Days();
</script>

{#if viewPoint.isDesktop}
	<div class="hidden 2xl:block">
		<OverviewDesktop {dates} trackers={checkInData.activeTrackers} />
	</div>
{:else}
	<div class="block 2xl:hidden">
		<OverviewMobile {dates} trackers={checkInData.activeTrackers} />
	</div>
{/if}
