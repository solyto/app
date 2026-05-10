<script lang="ts">
	import type { CheckInType } from '$lib/types/check_in';
	import { getCheckInData } from '$lib/state/CheckInData.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getUrlFormat } from '$lib/helpers/DateHelper';
	import { onMount } from 'svelte';
	import { urls } from '$lib/config/urls';
	import CheckInIcon from '$lib/components/check-in/overview/CheckInIcon.svelte';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import { resolve } from '$app/paths';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';

	let { dates, trackers } = $props<{
		dates: Date[];
		trackers: CheckInType[];
	}>();

	const checkInData = getCheckInData();
	const loadingIndicator = getLoadingIndicator();
	const auth = getAuth();
	const ts = getTranslation();

	onMount(async () => {
		loadingIndicator.start();
		await checkInData.load();
		loadingIndicator.stop();
	});

	function getData(date: string, type: CheckInType): number | null {
		const dayData = checkInData.getDayData(date);
		if (!dayData) return null;
		return dayData[type];
	}
</script>

<div class="border-r-2 border-c-neutral-1">
	<div class="flex">
		<div class="flex flex-col w-32">
			<div class="h-16">&nbsp;</div>
			{#each trackers as tracker (tracker)}
				<div class="flex w-full items-center justify-start font-bold h-12 p-3">
					<p>{ts.get.checkIn[tracker]}</p>
				</div>
			{/each}
		</div>
		<div class="flex flex-row items-start justify-center">
			{#each dates as date (date.getTime())}
				<div class="flex h-full flex-col w-8 items-center justify-center">
					<button
						type="button"
						class="h-16 flex items-center rotate-90 cursor-pointer text-sm hover:font-bold"
						onclick={() =>
							goto(resolve(urls.checkInDate, { date: getUrlFormat(new Date(date)) }))}
					>
						{auth.getDateWithoutYearInUserPreferredFormat(date)}
					</button>
					{#each trackers as tracker (tracker)}
						<div class="size-12 flex items-center justify-center p-3">
							{#if getData(getUrlFormat(new Date(date)), tracker) !== null}
								<CheckInIcon
									type={tracker}
									value={getData(getUrlFormat(new Date(date)), tracker)}
								/>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
