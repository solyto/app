<script lang="ts">
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import ViewSwitcher from '$lib/components/libraries/shared/ViewSwitcher.svelte';
	import Search from '$lib/components/libraries/shared/Search.svelte';
	import Recommender from '$lib/components/libraries/shared/Recommender.svelte';
	import Filter from '$lib/components/libraries/filters/Filter.svelte';
	import type { Library } from '$lib/types/library';
	import Releases from '$lib/components/libraries/shared/Releases.svelte';

	let { library } = $props<{ library: Library }>();

	const ts = getTranslation();
</script>

<div class="relative mb-4 w-full text-right">
	{#if library.config.hasViewSwitcher}
		<ViewSwitcher {library} />
	{/if}
	<div class="ml-auto flex items-center justify-end gap-2">
		{#if library.config.hasFilters}
			<Filter {library} />
		{/if}
		<Search {library} />
		{#if library.config.hasReleases}
			<Releases {library} />
		{/if}
		{#if library.config.hasRecommender}
			<Recommender {library} />
		{/if}
		{#if library.config.hasGenres}
			<div class="relative">
				<Button
					title={ts.get.libraries.edit_genres}
					onclick={() => library.openGenreModal()}
					type="slight"
				/>
			</div>
		{/if}
		<div class="relative">
			<Button title={ts.get.libraries.create} onclick={() => library.openCreateModal()} />
		</div>
	</div>
	<div class="text-surface-300 mx-2 my-4 text-xs">{library.entries.length} entries</div>
</div>
