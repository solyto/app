<script lang="ts">
	import { onMount } from 'svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import SubHeading from '$lib/components/ui/SubHeading.svelte';
	import type { OpenSourceLicense } from '$lib/types/license';

	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();

	let licenses = $state<OpenSourceLicense[]>([]);

	onMount(async () => {
		loadingIndicator.start();
		licenses = (await import('virtual:licenses')).default;
		loadingIndicator.stop();
	});
</script>

<div class="flex h-full w-full flex-col px-4 py-2">
	<SubHeading title={ts.get.layout.open_source_licenses} my={2} mb={2} />
	<div class="flex w-full flex-col gap-6">
		{#each licenses as license (`${license.name}@${license.version}`)}
			<section class="flex flex-col gap-2">
				<div class="flex flex-row flex-wrap items-baseline gap-x-2">
					<span class="font-semibold">{license.name}</span>
					<span class="text-sm text-c-neutral-5">{license.version}</span>
					<span class="text-sm text-c-neutral-5">{license.license}</span>
				</div>
				{#if license.text}
					<pre class="overflow-x-auto rounded-sm bg-c-bg-elevated p-3 font-mono text-xs whitespace-pre-wrap">{license.text}</pre>
				{/if}
			</section>
		{/each}
	</div>
</div>
