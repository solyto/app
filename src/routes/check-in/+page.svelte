<script lang="ts">
	import { getLast30Days } from '$lib/helpers/DateHelper';
	import { getViewPoint } from '$lib/state/Viewpoint.svelte.js';
	import { getCheckInData } from '$lib/state/CheckInData.svelte.js';
	import OverviewDesktop from '$lib/components/check-in/overview/OverviewDesktop.svelte';
	import OverviewMobile from '$lib/components/check-in/overview/OverviewMobile.svelte';
	import CheckInSummaries from '$lib/components/check-in/overview/CheckInSummaries.svelte';

	const viewPoint = getViewPoint();
	const checkInData = getCheckInData();

	const dates: Date[] = getLast30Days();
</script>

{#if viewPoint.isDesktop}
	<div class="hidden 2xl:flex 2xl:flex-row 2xl:items-start gap-0">
		<div class="w-3/4 2xl:w-[70%]">
			<OverviewDesktop {dates} trackers={checkInData.activeTrackers} />
		</div>
		<div class="w-1/4 2xl:w-[30%]">
			<CheckInSummaries {dates} trackers={checkInData.activeTrackers} />
		</div>
	</div>
{:else}
	<div class="flex flex-col gap-6 2xl:hidden">
		<CheckInSummaries {dates} trackers={checkInData.activeTrackers} />
		<OverviewMobile {dates} trackers={checkInData.activeTrackers} />
	</div>
{/if}
