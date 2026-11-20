<script lang="ts">
	import type { Alert, AlertSuggestion } from '$lib/types/alert';
	import { onMount } from 'svelte';
	import { setCheckInData } from '$lib/state/CheckInData.svelte';
	import { setAlerts } from '$lib/state/Alerts.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import { trackerLabel } from '$lib/helpers/CheckInHelper';
	import AlertService from '$lib/services/AlertService';
	import TrackerGlyph from '$lib/components/check-in/TrackerGlyph.svelte';
	import AlertEditor from '$lib/components/settings/alerts/AlertEditor.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import IconPencil from '$lib/icons/lucide/pencil.svelte';
	import IconPlus from '$lib/icons/lucide/plus.svelte';

	const checkInData = setCheckInData();
	const alerts = setAlerts();
	const ts = getTranslation();
	const auth = getAuth();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();
	const alertService = new AlertService();
	const ICON_BUTTON =
		'flex size-7 cursor-pointer items-center justify-center rounded-md text-c-neutral-5 transition-all hover:bg-c-neutral dark:hover:bg-s-dark-3';

	let editing = $state<Alert | 'new' | null>(null);

	onMount(async () => {
		await Promise.all([checkInData.loadTrackers(), alerts.load()]);
	});

	function tracker(id: number | null) {
		return checkInData.trackers.find((t) => t.id === id) ?? null;
	}

	function suggestionLabel(suggestion: AlertSuggestion): string {
		return ts.get.alerts[`suggestion_${suggestion.key}`];
	}

	async function run(action: () => Promise<boolean>): Promise<void> {
		loadingIndicator.start();
		const ok = await action();
		loadingIndicator.stop();
		if (!ok) notifications.error(ts.get.alerts.save_error);
	}
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<p class="text-sm text-c-neutral-5 dark:text-c-neutral-4">{ts.get.alerts.description}</p>

	{#if alerts.loaded}
		{#if alerts.alerts.length === 0}
			<p class="text-sm">{ts.get.alerts.empty}</p>
		{:else}
			<div class="flex flex-col gap-3">
				{#each alerts.alerts as alert (alert.id)}
					{@const alertTracker = tracker(alert.check_in_tracker_id)}
					{#if alertTracker}
						<div class="flex items-center gap-3" class:opacity-50={!alert.enabled}>
							<TrackerGlyph tracker={alertTracker} class="size-4 shrink-0 text-c-heading dark:text-c-primary" />
							<div class="flex min-w-0 flex-1 flex-col">
								<span class="text-sm">
									<span class="font-semibold">{trackerLabel(alertTracker, ts.get.checkIn)}:</span>
									{alertService.describe(alert.rule, alert.threshold, alert.days, ts.get.alerts)}
								</span>
								<span class="text-xs text-c-neutral-5 dark:text-c-neutral-4">
									{#if alert.state.active}
										<span class="font-semibold text-c-heading dark:text-c-primary">{ts.get.alerts.active_now}</span>
									{/if}
									{#if alert.last_triggered_on}
										{ts.get.alerts.last_sent.replace('%s', auth.getDateWithoutYearInUserPreferredFormat(alert.last_triggered_on))}
									{/if}
									{#if alert.source === 'goal'}
										{ts.get.alerts.goal_alert_hint}
									{/if}
								</span>
							</div>
							<Toggle checked={alert.enabled} onchange={() => run(() => alerts.update(alert, { enabled: !alert.enabled }))} />
							<button
								type="button"
								class={ICON_BUTTON}
								class:invisible={alert.source === 'goal'}
								disabled={alert.source === 'goal'}
								aria-label={ts.get.alerts.edit_alert}
								title={ts.get.alerts.edit_alert}
								onclick={() => (editing = alert)}
							>
								<IconPencil class="size-4" />
							</button>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<button
			type="button"
			class="flex cursor-pointer items-center gap-1 self-start text-sm font-semibold text-c-heading dark:text-c-primary"
			onclick={() => (editing = 'new')}
		>
			<IconPlus class="size-4" />
			{ts.get.alerts.new_alert}
		</button>

		{#if alerts.suggestions.length > 0}
			<div class="flex flex-col gap-2 border-t border-c-neutral-1 pt-3 dark:border-s-dark">
				<p class="text-sm font-semibold text-c-neutral-5 dark:text-c-neutral-4">{ts.get.alerts.suggestions}</p>
				{#each alerts.suggestions as suggestion (suggestion.key)}
					{@const suggestionTracker = tracker(suggestion.check_in_tracker_id)}
					<div class="flex items-center gap-3">
						{#if suggestionTracker}
							<TrackerGlyph tracker={suggestionTracker} class="size-4 shrink-0 text-c-neutral-5 dark:text-c-neutral-4" />
						{/if}
						<span class="flex-1 text-sm">{suggestionLabel(suggestion)}</span>
						<button
							type="button"
							class="flex cursor-pointer items-center gap-1 text-sm font-semibold text-c-heading dark:text-c-primary"
							onclick={() => run(() => alerts.enableSuggestion(suggestion.key))}
						>
							<IconPlus class="size-4" />
							{ts.get.alerts.suggestion_add}
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<p class="text-xs text-c-neutral-5 dark:text-c-neutral-4">{ts.get.alerts.channels_hint}</p>
	{/if}
</div>

{#if editing !== null}
	<AlertEditor alert={editing === 'new' ? null : editing} onClose={() => (editing = null)} />
{/if}
