<script lang="ts">
	import type { YoutubeVideo } from '$lib/types/library_youtube';
	import { YoutubeLibrary } from '$lib/state/YoutubeLibrary.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import StarButton from '$lib/components/ui/buttons/StarButton.svelte';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';

	let { entry, library } = $props<{
		entry: YoutubeVideo;
		library: YoutubeLibrary;
	}>();

	const loadingIndicator = getLoadingIndicator();

	async function onStar(e: MouseEvent) {
		e.preventDefault();
		loadingIndicator.start();
		await library.update(entry, { is_favorite: !entry.is_favorite });
		loadingIndicator.stop();
	}

	async function onDelete(e: MouseEvent) {
		e.preventDefault();
		loadingIndicator.start();
		await library.delete(entry);
		loadingIndicator.stop();
	}
</script>

<div class="flex w-full min-w-0 items-center gap-2">
	<div
		class="h-9/10 w-1 flex-shrink-0 rounded-full"
		style="background-color: {entry.category?.color ?? '#1dbda5'};"
	></div>
	<div class="min-w-0 flex-1 text-left">
		<div class="truncate font-bold">{entry.title}</div>
		{#if library.view === 'list'}
			<div
				class="mt-1 inline-block bg-c-neutral px-2 py-1 text-xs max-md:hidden dark:bg-s-dark-2"
			>
				{entry.category?.title ?? 'Uncategorized'}
			</div>
		{/if}
	</div>
	<div class="ml-auto flex flex-shrink-0 flex-row items-center gap-1">
		<StarButton onClick={(e: MouseEvent) => onStar(e)} selected={entry.is_favorite} />
		<InlineDeleteButton onClick={(e: MouseEvent) => onDelete(e)} />
	</div>
</div>
