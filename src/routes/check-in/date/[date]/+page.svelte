<script lang="ts">
	import type { CheckInTracker } from '$lib/types/check_in';
	import DailyCheckIn from '$lib/components/check-in/daily/DailyCheckIn.svelte';
	import DailyLogTracker from '$lib/components/check-in/daily/DailyLogTracker.svelte';
	import CheckInSettings from '$lib/components/check-in/CheckInSettings.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import IconPlus from '$lib/icons/lucide/plus.svelte';
	import IconX from '$lib/icons/lucide/x.svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { SvelteMap } from 'svelte/reactivity';
	import { formatDate, isDateToday, isDateYesterday, parseUrlFormat } from '$lib/helpers/DateHelper';
	import { trackerLabel } from '$lib/helpers/CheckInHelper';
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import LocalStorageService from '$lib/services/LocalStorageService';

	const checkInData = getCheckInData();
	const auth = getAuth();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();
	const localStorage = new LocalStorageService();
	const INTRO_DISMISSED_KEY = 'check_in_trackers_intro_dismissed';
	const AREA_TITLE = 'text-sm font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary';

	const pending = new SvelteMap<CheckInTracker, number | null>();
	let addingTracker = $state<boolean>(false);
	let introVisible = $state<boolean>(!localStorage.getBool(INTRO_DISMISSED_KEY));

	let date = $derived(page.params.date ?? '');
	let parsedDate = $derived(parseUrlFormat(date));
	const isToday = $derived(parsedDate !== null && isDateToday(parsedDate));
	const isYesterday = $derived(parsedDate !== null && isDateYesterday(parsedDate));

	afterNavigate(() => {
		pending.clear();
	});

	function goalProgress(tracker: CheckInTracker) {
		if (!tracker.goal || parsedDate === null) return null;
		return checkInData.trackerService.goalProgress(tracker, checkInData.index, parsedDate, auth.getWeekStart());
	}

	function ratingValue(tracker: CheckInTracker): number | null {
		return pending.has(tracker) ? pending.get(tracker)! : checkInData.getValue(tracker, date);
	}

	async function onSave(): Promise<void> {
		if (pending.size === 0) return;
		loadingIndicator.start();
		const ok = await checkInData.saveDay(date, pending);
		loadingIndicator.stop();

		if (ok) {
			pending.clear();
			notifications.success(ts.get.checkIn.save_success);
		} else {
			notifications.error(ts.get.checkIn.save_error);
		}
	}

	async function setLog(tracker: CheckInTracker, value: number | null): Promise<void> {
		if (!(await checkInData.setValue(tracker, date, value))) notifications.error(ts.get.checkIn.save_error);
	}

	function dismissIntro(): void {
		introVisible = false;
		localStorage.setBool(INTRO_DISMISSED_KEY, true);
	}
</script>

<div class="relative mt-8 flex flex-col gap-8">
	<div class="flex w-full flex-col items-center justify-center gap-1">
		<h2 class="text-3xl font-bold">
			{#if isToday}
				{ts.get.checkIn.today}
			{:else if isYesterday}
				{ts.get.checkInSummary.day_yesterday}
			{:else}
				{formatDate(parsedDate!)}
			{/if}
		</h2>
	</div>

	{#if checkInData.ratingTrackers.length > 0}
		<div class="flex w-full justify-center sm:absolute sm:top-0 sm:right-8 sm:w-auto">
			<TextButton title={ts.get.layout.save} onclick={onSave} disabled={pending.size === 0} class="max-sm:h-14 max-sm:w-full" />
		</div>
	{/if}

	{#if introVisible && checkInData.loaded}
		<div class="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-xl bg-c-bg-surface px-4 py-3 text-sm shadow-sm">
			<span class="flex-1">{ts.get.checkIn.intro_text}</span>
			<button type="button" class="flex cursor-pointer items-center gap-1 font-semibold text-c-heading dark:text-c-primary" onclick={dismissIntro}>
				<IconX class="size-4" />
				{ts.get.checkIn.intro_dismiss}
			</button>
		</div>
	{/if}

	<div class="flex flex-col gap-12 md:mx-auto md:w-fit 2xl:flex-row 2xl:items-start 2xl:gap-24">
		{#if checkInData.ratingTrackers.length > 0}
			<section class="flex flex-col space-y-4">
				<h3 class="{AREA_TITLE} pl-4 md:pl-0">{ts.get.checkIn.area_ratings}</h3>
				{#each checkInData.ratingTrackers as tracker (tracker.id)}
					<DailyCheckIn
						{tracker}
						label={trackerLabel(tracker, ts.get.checkIn)}
						currentValue={ratingValue(tracker)}
						onChange={(changed, value) => pending.set(changed, value)}
						selectedSports={checkInData.selectedSports}
						progress={goalProgress(tracker)}
					/>
				{/each}
			</section>
		{/if}

		<section class="flex flex-col gap-2 px-4 md:px-0 2xl:w-[26rem] 2xl:shrink-0">
			<h3 class={AREA_TITLE}>{ts.get.checkIn.area_logs}</h3>
			{#if checkInData.logTrackers.length === 0}
				<button
					type="button"
					class="flex cursor-pointer items-center gap-1 self-start text-sm text-c-neutral-5 transition-all hover:text-c-heading dark:text-c-neutral-4 dark:hover:text-c-primary"
					onclick={() => (addingTracker = true)}
				>
					{ts.get.checkIn.logs_empty}
					<span aria-hidden="true">→</span>
					<IconPlus class="size-4" />
					<span class="font-semibold">{ts.get.checkIn.add_tracker}</span>
				</button>
			{:else}
				{#each checkInData.logTrackers as tracker (tracker.id)}
					<DailyLogTracker
						{tracker}
						label={trackerLabel(tracker, ts.get.checkIn)}
						value={checkInData.getValue(tracker, date)}
						progress={goalProgress(tracker)}
						onSet={(value) => setLog(tracker, value)}
					/>
				{/each}
			{/if}
		</section>
	</div>
</div>

{#if addingTracker}
	<CheckInSettings startWithNewTracker onClose={() => (addingTracker = false)} />
{/if}
