<script lang="ts">
	import type { CheckInTracker } from '$lib/types/check_in';
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import TrackerReminderRow from '$lib/components/check-in/settings/TrackerReminderRow.svelte';
	import IconPlus from '$lib/icons/lucide/plus.svelte';

	let { tracker }: { tracker: CheckInTracker } = $props();

	const checkInData = getCheckInData();
	const ts = getTranslation();
	const notifications = getUiNotifications();
	const MAX_REMINDERS = 10;

	const hint = $derived(
		tracker.type === 'yes_no'
			? ts.get.checkIn.reminder_hint_yes_no
			: tracker.type === 'count'
				? ts.get.checkIn.reminder_hint_count
				: ts.get.checkIn.reminder_hint_rating
	);

	async function report(ok: Promise<boolean>): Promise<void> {
		if (!(await ok)) notifications.error(ts.get.checkIn.save_error);
	}

	function add(): void {
		const target = tracker.type === 'count' ? Math.max(1, Math.round(tracker.goal?.target ?? 1)) : undefined;
		report(checkInData.addAlert(tracker, { time: '20:00', target }));
	}
</script>

<div>
	<p class="mb-1 text-sm font-semibold text-c-neutral-5 dark:text-c-neutral-4">{ts.get.checkIn.reminders}</p>
	<p class="mb-2 text-xs text-c-neutral-5 dark:text-c-neutral-4">{hint}</p>
	<div class="flex flex-col gap-2">
		{#each tracker.alerts as alert (alert.id)}
			<TrackerReminderRow
				{tracker}
				{alert}
				onChange={(time, target) => report(checkInData.updateAlert(alert.id, { time, target: target ?? undefined }))}
				onDelete={() => report(checkInData.deleteAlert(alert.id))}
			/>
		{/each}
	</div>
	{#if tracker.alerts.length < MAX_REMINDERS}
		<button type="button" class="mt-2 flex cursor-pointer items-center gap-1 text-sm text-c-heading dark:text-c-primary" onclick={add}>
			<IconPlus class="size-4" />
			{ts.get.checkIn.reminder_add}
		</button>
	{/if}
	{#if tracker.alerts.length > 0}
		<p class="mt-2 text-xs text-c-neutral-5 dark:text-c-neutral-4">{ts.get.checkIn.reminder_channels_hint}</p>
	{/if}
</div>
