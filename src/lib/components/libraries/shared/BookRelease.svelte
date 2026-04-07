<script lang="ts">
	import { formatDate } from '$lib/helpers/DateHelper.js';
	import HardcoverButton from '$lib/components/ui/buttons/HardcoverButton.svelte';
	import type { BookRelease } from '$lib/types/library_book';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import type { BookLibrary } from '$lib/state/BookLibrary.svelte';
	import MissingCover from '$lib/components/libraries/shared/MissingCover.svelte';

	const ts = getTranslation();

	let { release, library } = $props<{
		release: BookRelease;
		library: BookLibrary;
	}>();
</script>

<div
	class="flex w-full flex-col gap-4 rounded-lg border-1 border-c-neutral-1 bg-c-bg-surface p-4 shadow-sm md:flex-row dark:border-s-dark-2"
>
	<div class="flex justify-center">
		{#if release.cover === null || release.cover === undefined || release.cover === ''}
			<div
				class="relative flex size-48 items-center justify-center rounded-lg bg-c-neutral text-xs text-c-neutral-5"
			>
				<MissingCover {library} />
			</div>
		{:else}
			<img src={release.cover} loading="lazy" alt="Cover" class="rounded-lg md:size-48" />
		{/if}
	</div>
	<div class="flex flex-col items-start justify-between gap-2 md:max-w-96 md:min-w-60">
		<div class="flex flex-col items-start">
			<h2 class="text-left text-lg font-bold">{release.title}</h2>
			<p class="text-md text-left">{release.author}</p>
			{#if release.description}
				<p class="mt-2 text-left text-sm">{release.description}</p>
			{/if}
			<div class="mt-2 text-sm">
				<span class="font-bold">{ts.get.libraries.release_date}:</span>
				{formatDate(release.release_date)}
			</div>
		</div>
		<HardcoverButton link={release.url} />
	</div>
</div>
