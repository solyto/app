<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import { getFeatures } from '$lib/state/Features.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';

	const ts = getTranslation();
	const features = getFeatures();
	const loadingIndicator = getLoadingIndicator();

	async function onChange(): Promise<void> {
		loadingIndicator.start();
		await features.save();
		loadingIndicator.stop();
	}
</script>

<div class="md:p-4">
	<Card label={ts.get.settings.features} hover={false}>
		<div class="flex w-full flex-col gap-2">
			{#each Object.keys(features.features) as featureType (featureType)}
				<div class="flex w-full justify-between">
					<span>{ts.get.nav[featureType]}</span>
					<Toggle bind:checked={features.features[featureType]} onchange={onChange} />
				</div>
			{/each}
		</div>
	</Card>
</div>
