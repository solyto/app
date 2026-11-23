<script lang="ts">
	import type { Alert, AlertSuggestion, AlertSuggestionKey } from '$lib/types/alert';
	import { onMount } from 'svelte';
	import { setCheckInData } from '$lib/state/CheckInData.svelte';
	import { setAlerts } from '$lib/state/Alerts.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import { trackerLabel } from '$lib/helpers/CheckInHelper';
	import AlertService from '$lib/services/AlertService';
	import AlertEditor from '$lib/components/settings/alerts/AlertEditor.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import AddButton from '$lib/components/ui/buttons/AddButton.svelte';
	import EditButton from '$lib/components/ui/buttons/EditButton.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';

	const checkInData = setCheckInData();
	const alerts = setAlerts();
	const ts = getTranslation();
	const auth = getAuth();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();
	const alertService = new AlertService();
	let editing = $state<Alert | 'new' | null>(null);

	onMount(async () => {
		await Promise.all([checkInData.loadTrackers(), alerts.load()]);
	});

	function tracker(id: number | null) {
		return checkInData.trackers.find((t) => t.id === id) ?? null;
	}

	// What the rule sees now and when it last sent.
	function details(alert: Alert): string {
		return [
			alert.state.active ? ts.get.alerts.active_now : null,
			alert.last_triggered_on ? ts.get.alerts.last_sent.replace('%s', auth.getDateWithoutYearInUserPreferredFormat(alert.last_triggered_on)) : null
		]
			.filter((part) => part !== null)
			.join(' · ');
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

	// A double click mustn't add the same suggestion twice.
	let addingSuggestion = $state<boolean>(false);

	async function addSuggestion(key: AlertSuggestionKey): Promise<void> {
		if (addingSuggestion) return;
		addingSuggestion = true;
		try {
			await run(() => alerts.enableSuggestion(key));
		} finally {
			addingSuggestion = false;
		}
	}
</script>

<div class="absolute top-0 right-0 flex h-8 items-center">
	<AddButton onClick={() => (editing = 'new')} title={ts.get.alerts.new_alert} />
</div>

<div class="flex w-full max-w-2xl flex-col gap-4">
	<p class="text-sm text-c-neutral-5 dark:text-c-neutral-4">{ts.get.alerts.description}</p>

	{#if alerts.loaded}
		{#if alerts.alerts.length === 0}
			<p class="text-sm text-c-neutral-5 dark:text-c-neutral-4">{ts.get.alerts.empty}</p>
		{:else}
			<div class="flex w-full flex-col gap-2">
				{#each alerts.alerts as alert (alert.id)}
					{@const alertTracker = tracker(alert.check_in_tracker_id)}
					{#if alertTracker}
						<div class="flex w-full items-center justify-between gap-3">
							<div class="flex min-w-0 flex-col" class:opacity-50={!alert.enabled}>
								<span>{trackerLabel(alertTracker, ts.get.checkIn)}: {alertService.describe(alert.rule, alert.threshold, alert.days, ts.get.alerts)}</span>
								{#if details(alert) !== ''}
									<span class="text-xs text-c-neutral-4 dark:text-c-neutral-5">{details(alert)}</span>
								{/if}
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<!-- Goal alerts are changed on the Goals page; the hidden button keeps the columns aligned. -->
								<div class:invisible={alert.source === 'goal'}>
									<EditButton title={ts.get.alerts.edit_alert} onClick={() => (editing = alert)} inModal={false} buttonStyle="fill-on-hover" />
								</div>
								<Toggle checked={alert.enabled} onchange={() => run(() => alerts.update(alert, { enabled: !alert.enabled }))} />
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		{#if alerts.suggestions.length > 0}
			<div class="mt-4">
				<SettingsSection label={ts.get.alerts.suggestions}>
					<div class="flex w-full flex-col gap-2">
						{#each alerts.suggestions as suggestion (suggestion.key)}
							<div class="flex w-full items-center justify-between gap-3">
								<span>{suggestionLabel(suggestion)}</span>
								<TextButton title={ts.get.alerts.suggestion_add} type="slight" disabled={addingSuggestion} onclick={() => addSuggestion(suggestion.key)} />
							</div>
						{/each}
					</div>
				</SettingsSection>
			</div>
		{/if}
	{/if}
</div>

{#if editing !== null}
	<AlertEditor alert={editing === 'new' ? null : editing} onClose={() => (editing = null)} />
{/if}
