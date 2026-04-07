<script lang="ts">
	import { formatDate } from '$lib/helpers/DateHelper.js';
	import DeezerButton from '$lib/components/ui/buttons/DeezerButton.svelte';
	import type { MusicRelease } from '$lib/types/library_music';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import MissingCover from '$lib/components/libraries/shared/MissingCover.svelte';
	import type { MusicLibrary } from '$lib/state/MusicLibrary.svelte';
	import DeezerSneakPreview from '$lib/components/libraries/music/DeezerSneakPreview.svelte';
	import DeezerIcon from '$lib/assets/services/deezer_icon.svg';

	const ts = getTranslation();

	let { release, library } = $props<{
		release: MusicRelease;
		library: MusicLibrary;
	}>();

	let sneakPreview = $state<boolean>(false);
</script>

<div
	class="flex w-full flex-col items-start gap-4 rounded-lg border-1 border-c-neutral-1 bg-c-bg-surface p-4 shadow-sm dark:border-s-dark-2"
>
	<div class="flex flex-col gap-4 md:flex-row">
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
		<div class="flex flex-col items-start justify-between gap-2 md:min-w-60">
			<div class="flex flex-col items-start">
				<h2 class="text-left text-lg font-bold">{release.title}</h2>
				<p class="text-md text-left">{release.artist}</p>
				<div class="mt-2 text-sm">
					<span class="font-bold">{ts.get.libraries.release_date}:</span>
					{formatDate(release.release_date)}
				</div>
			</div>
			<div class="flex flex-row items-start gap-2">
				<DeezerButton link={release.url} />
				<button
					class="group mt-2 mb-1 flex cursor-pointer items-center gap-3 rounded-lg border-1 border-c-neutral p-2 text-sm font-bold shadow-sm transition-all hover:text-[#a238ff] dark:border-s-dark-2"
					onclick={() => (sneakPreview = !sneakPreview)}
				>
					<img
						src={DeezerIcon}
						alt="Deezer icon"
						class="size-6 group-hover:animate-pulse"
					/>
					{ts.get.libraries.music.deezer_preview}
				</button>
			</div>
		</div>
	</div>
	{#if sneakPreview}
		<DeezerSneakPreview {release} />
	{/if}
</div>
