<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getNavigation } from '$lib/state/Navigation.svelte';

	const ts = getTranslation();
	const nav = getNavigation();
	const loadingIndicator = getLoadingIndicator();

	async function onChange(): Promise<void> {
		loadingIndicator.start();
		await nav.save();
		loadingIndicator.stop();
	}
</script>

<div class="md:p-4">
	<SettingsSection label={ts.get.settings.features}>
		<div class="flex w-full flex-col gap-2">
			{#each Object.keys(nav.features) as featureType (featureType)}
				<div class="flex w-full justify-between">
					<span>{ts.get.nav[featureType]}</span>
					<Toggle bind:checked={nav.features[featureType]} onchange={onChange} />
				</div>
			{/each}
		</div>
	</SettingsSection>
</div>
