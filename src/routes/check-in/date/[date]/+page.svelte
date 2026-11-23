<script lang="ts">
	import type { CheckInTracker } from '$lib/types/check_in';
	import DailyCheckIn from '$lib/components/check-in/daily/DailyCheckIn.svelte';
	import DailyLogTracker from '$lib/components/check-in/daily/DailyLogTracker.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { SvelteMap } from 'svelte/reactivity';
	import { formatDate, isDateToday, isDateYesterday, parseUrlFormat } from '$lib/helpers/DateHelper';
	import { goalProgressText, trackerLabel, type GoalLine } from '$lib/helpers/CheckInHelper';
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { getGoals } from '$lib/state/Goals.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';

	const checkInData = getCheckInData();
	const goals = getGoals();
	const auth = getAuth();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	// From 2xl on: a side column set off by a line, like the averages on the History page; narrower, a plain list below the ratings.
	const SIDE_COLUMN =
		'2xl:col-start-3 2xl:mr-0 2xl:ml-16 2xl:w-auto 2xl:max-w-[22rem] 2xl:border-l-2 2xl:border-c-neutral-1 2xl:pl-6 dark:2xl:border-s-dark';

	// Unsaved changes by tracker id: the settings reload the trackers as new objects while this page stays open.
	const pending = new SvelteMap<number, number | null>();
	// What Save stores: only changes on trackers still shown, so one switched off or deleted meanwhile isn't saved unseen.
	const changes = $derived.by(() => {
		const shownChanges = new Map<CheckInTracker, number | null>();
		for (const tracker of checkInData.activeTrackers) {
			if (pending.has(tracker.id)) shownChanges.set(tracker, pending.get(tracker.id)!);
		}
		return shownChanges;
	});

	let saving = $state<boolean>(false);

	let date = $derived(page.params.date ?? '');
	let parsedDate = $derived(parseUrlFormat(date));
	const isToday = $derived(parsedDate !== null && isDateToday(parsedDate));
	const isYesterday = $derived(parsedDate !== null && isDateYesterday(parsedDate));

	afterNavigate(() => {
		pending.clear();
		// A day from before the loaded months, e.g. opened from the calendar.
		if (date !== '') void checkInData.loadValuesFrom(date);
	});

	// Today only: the goal's period is the one running now.
	function goalLine(tracker: CheckInTracker): GoalLine | null {
		const goal = goals.forTracker(tracker.id);
		if (!goal || !isToday || parsedDate === null) return null;

		const progress = checkInData.trackerService.goalProgress(goal, tracker, checkInData.index, parsedDate, auth.getWeekStart());
		return { text: goalProgressText(goal, tracker, progress, ts.get.checkIn), met: progress.met };
	}

	// Unsaved changes show right away; only Save stores them.
	function shownValue(tracker: CheckInTracker): number | null {
		return pending.has(tracker.id) ? pending.get(tracker.id)! : checkInData.getValue(tracker, date);
	}

	async function onSave(): Promise<void> {
		if (changes.size === 0 || saving) return;
		saving = true;
		const saved = new Map(changes);
		loadingIndicator.start();
		const ok = await checkInData.saveDay(date, saved);
		loadingIndicator.stop();
		saving = false;

		if (ok) {
			// Only what was saved: a tap made while saving stays pending.
			for (const [tracker, value] of saved) {
				if (pending.get(tracker.id) === value) pending.delete(tracker.id);
			}
			notifications.success(ts.get.checkIn.save_success);
			// Goal progress is worked out on the server, so the Goals tab needs it fresh.
			void goals.load();
		} else {
			notifications.error(ts.get.checkIn.save_error);
		}
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

	{#if checkInData.activeTrackers.length > 0}
		<!-- On phones it floats at the bottom, and only once there's something to save; wider, it sits top right. -->
		<div
			class="z-10 flex w-full justify-center max-sm:sticky max-sm:bottom-4 max-sm:order-last max-sm:px-4 sm:absolute sm:top-0 sm:right-8 sm:w-auto"
			class:max-sm:hidden={changes.size === 0}
		>
			<TextButton title={ts.get.layout.save} onclick={onSave} disabled={changes.size === 0 || saving} class="max-sm:h-14 max-sm:w-full max-sm:shadow-md" />
		</div>
	{/if}

	<!-- The ratings stay centred in the middle column; your own trackers sit a fixed distance to their right. -->
	<div class="flex flex-col gap-12 md:mx-auto md:w-fit 2xl:grid 2xl:w-full 2xl:grid-cols-[1fr_auto_1fr] 2xl:items-start 2xl:gap-0">
		{#if checkInData.ratingTrackers.length > 0}
			<section class="flex flex-col space-y-3 2xl:col-start-2">
				{#each checkInData.ratingTrackers as tracker (tracker.id)}
					<DailyCheckIn
						{tracker}
						label={trackerLabel(tracker, ts.get.checkIn)}
						currentValue={shownValue(tracker)}
						onChange={(changed, value) => pending.set(changed.id, value)}
						selectedSports={checkInData.selectedSports}
						goalLine={goalLine(tracker)}
					/>
				{/each}
			</section>
		{/if}

		{#if checkInData.logTrackers.length > 0}
			<section
				class="flex flex-col gap-1 px-5 md:mx-auto md:w-[26rem] md:px-0 {checkInData.ratingTrackers.length > 0 ? SIDE_COLUMN : ''}"
			>
				{#each checkInData.logTrackers as tracker (tracker.id)}
					<DailyLogTracker
						{tracker}
						label={trackerLabel(tracker, ts.get.checkIn)}
						value={shownValue(tracker)}
						goalLine={goalLine(tracker)}
						onSet={(value) => pending.set(tracker.id, value)}
					/>
				{/each}
			</section>
		{/if}
	</div>
</div>

