<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getNavigation } from '$lib/state/Navigation.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import type { FeatureType } from '$lib/config/navigation';
	import type { NavigationRecords } from '$lib/types/translation';

	const ts = getTranslation();
	const nav = getNavigation();
	const auth = getAuth();
	const loadingIndicator = getLoadingIndicator();

	async function onChange(): Promise<void> {
		loadingIndicator.start();
		await nav.save();
		loadingIndicator.stop();
	}

	async function onJournalEnabled(value: boolean): Promise<void> {
		loadingIndicator.start();
		await auth.updateJournalEnabled(value);
		loadingIndicator.stop();
	}

	async function onJournalCalendarMark(value: boolean): Promise<void> {
		loadingIndicator.start();
		await auth.updateJournalCalendarMark(value);
		loadingIndicator.stop();
	}

	async function onCheckInCalendarMark(value: boolean): Promise<void> {
		loadingIndicator.start();
		await auth.updateCheckInCalendarMark(value);
		loadingIndicator.stop();
	}
</script>

<div>
	<SettingsSection label={ts.get.settings.features}>
		<div class="flex w-full flex-col gap-2">
			{#each Object.keys(nav.features).filter((key) => key in ts.get.nav) as featureType (featureType)}
				<div class="flex w-full justify-between">
					<span>{ts.get.nav[featureType as keyof NavigationRecords]}</span>
					<Toggle bind:checked={nav.features[featureType as FeatureType]} onchange={onChange} />
				</div>
			{/each}
		</div>
	</SettingsSection>

	<div class="mt-8">
		<SettingsSection label={ts.get.settings.calendar_life_marks}>
			<div class="flex w-full flex-col gap-2">
				<div class="flex w-full justify-between">
					<span>{ts.get.settings.journal_enabled}</span>
					<Toggle
						checked={auth.user?.settings?.journal_enabled ?? false}
						onchange={onJournalEnabled}
					/>
				</div>
				<div class="flex w-full justify-between">
					<span>{ts.get.settings.journal_calendar_mark}</span>
					<Toggle
						checked={auth.user?.settings?.journal_calendar_mark ?? false}
						onchange={onJournalCalendarMark}
					/>
				</div>
				<div class="flex w-full justify-between">
					<span>{ts.get.settings.check_in_calendar_mark}</span>
					<Toggle
						checked={auth.user?.settings?.check_in_calendar_mark ?? false}
						onchange={onCheckInCalendarMark}
					/>
				</div>
			</div>
		</SettingsSection>
	</div>
</div>
