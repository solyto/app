<script lang="ts">
	import type { CreateCheckInRequest, CheckInType } from '$lib/types/check_in';
	import DailyCheckIn from '$lib/components/check-in/daily/DailyCheckIn.svelte';
	import IconChevronLeft from '@lucide/svelte/icons/chevron-left';
	import IconChevronRight from '@lucide/svelte/icons/chevron-right';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		formatDate,
		getUrlFormat,
		getNextDay,
		getPrevDay,
		isDateInTheFuture,
		isDateToday,
		isDateYesterday
	} from '$lib/helpers/DateHelper';
	import { getCheckInData } from '$lib/state/CheckInData.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte.js';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { onMount } from 'svelte';

	const checkInData = getCheckInData();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let save = $state<CreateCheckInRequest | null>(null);
	let date = $state(page.params.date);
	let dayData = $state(checkInData.getDayData());

	onMount(async () => {
		loadingIndicator.start();
		await checkInData.load();
		loadingIndicator.stop();
	});

	$effect(() => {
		date = page.params.date;
		dayData = checkInData.getDayData();
		save = null;
	});

	async function onChange(type: CheckInType, value: number): Promise<void> {
		if (save === null) {
			save = {
				date: checkInData.selectedDate,
				[type]: value
			};
		} else {
			save[type] = value;
		}
	}

	async function onSave(): Promise<void> {
		if (save === null || save.date === null) {
			return;
		}

		loadingIndicator.start();
		await checkInData.save(save);
		loadingIndicator.stop();
		notifications.success(ts.get.checkIn.save_success);
	}
</script>

<div class="relative mt-8 flex-row space-y-4">
	<div class="mb-8 flex w-full flex-row items-center justify-center gap-4">
		<button
			type="button"
			class="cursor-pointer"
			onclick={() => goto(getUrlFormat(getPrevDay(new Date(date))))}
		>
			<IconChevronLeft />
		</button>
		<h2 class="text-xl font-bold sm:text-2xl">
			{#if isDateToday(new Date(date))}
				Today
			{:else if isDateYesterday(new Date(date))}
				Yesterday
			{:else}
				{formatDate(date)}
			{/if}
		</h2>
		<button
			type="button"
			class="cursor-pointer {isDateInTheFuture(getNextDay(new Date(date)))
				? 'opacity-0'
				: 'opacity-100'}"
			onclick={() => goto(getUrlFormat(getNextDay(new Date(date))))}
		>
			<IconChevronRight />
		</button>
	</div>
	{#each checkInData.activeTrackers as type (type)}
		<DailyCheckIn {type} label={ts.get.checkIn[type]} currentValue={dayData?.[type]} {onChange} selectedSports={checkInData.settings.selectedSports} />
	{/each}
	<div class="mb-8 flex w-full justify-center sm:absolute sm:top-0 sm:right-8 sm:mb-0 sm:w-auto">
		<Button title={ts.get.layout.save} onclick={onSave} class="max-sm:h-14 max-sm:w-full" />
	</div>
</div>
