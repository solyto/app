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

<Card fixedWidth={true} fullWidth={true} hover={false}>
	<div class="flex flex-row space-x-2 border-b-2 border-c-neutral-1 p-4 dark:border-s-dark">
		<div class="flex w-32 items-center justify-center">
			<p></p>
		</div>
		{#each dates as date (date.getTime())}
			<div class="flex w-8 items-center justify-center pt-4 pb-6">
				<button
					type="button"
					class="rotate-90 cursor-pointer text-sm hover:font-bold"
					onclick={() =>
						goto(resolve(urls.checkInDate, { date: getUrlFormat(new Date(date)) }))}
				>
					{auth.getDateInUserPreferredFormat(date)}
				</button>
			</div>
		{/each}
	</div>
	{#each trackers as tracker (tracker)}
		<div class="flex flex-row space-x-2 p-4">
			<div class="flex w-32 items-center justify-start font-bold">
				<p>{ts.get.checkIn[tracker]}</p>
			</div>
			{#each dates as date (date.getTime())}
				<div class="flex w-8 items-center justify-center">
					<CheckInIcon
						type={tracker}
						value={getData(getUrlFormat(new Date(date)), tracker)}
					/>
				</div>
			{/each}
		</div>
	{/each}
</Card>
