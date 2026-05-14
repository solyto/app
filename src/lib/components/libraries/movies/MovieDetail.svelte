<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { formatDate } from '$lib/helpers/DateHelper.js';
	import DetailModal from '$lib/components/libraries/shared/DetailModal.svelte';
	import { getMovieLibrary } from '$lib/state/MovieLibrary.svelte';
	import type { Movie, MovieTrailer } from '$lib/types/library_movie';

	const library = getMovieLibrary();
	const entry = library.activeEntry as Movie;

	const ts = getTranslation();

	let trailers = $state<MovieTrailer[]>([]);
	let trailersLoaded = $state<boolean>(false);
	let trailersVisible = $state<boolean>(false);

	async function toggleTrailers(): Promise<void> {
		trailersVisible = !trailersVisible;

		if (trailersVisible && !trailersLoaded) {
			trailers = await library.loadTrailers(entry);
			trailersLoaded = true;
		}
	}
</script>

<DetailModal {entry} {library}>
	<h2 class="text-xl font-bold">{entry.title}</h2>
	<div class="text-sm text-c-neutral-6">
		{#if entry.category === 'movie'}
			{ts.get.libraries.movies.category_movie}
		{:else}
			{ts.get.libraries.movies.category_series}
		{/if}
	</div>
	<div class="text-sm text-c-neutral-6">
		{entry.genres.map((g) => g.title).join(', ')}
	</div>
	<div class:hidden={entry.tags.length === 0} class="text-sm text-c-neutral-6">
		{entry.tags.map((t) => t.name).join(', ')}
	</div>
	<div class="text-sm" class:hidden={entry.publication_year === null}>
		{entry.publication_year}
	</div>
	<div class:hidden={entry.started_at === null}>
		{ts.get.libraries.movies.started_at}
		{formatDate(entry.started_at)}
	</div>
	<div class:hidden={entry.finished_at === null}>
		{ts.get.libraries.movies.finished_at}
		{formatDate(entry.finished_at)}
	</div>

	<button
		class="mt-2 cursor-pointer rounded-sm border-1 border-c-neutral-2 px-3 py-1.5 text-sm font-semibold transition-all hover:border-c-primary hover:text-c-primary dark:border-s-dark-2"
		onclick={toggleTrailers}
	>
		{trailersVisible ? 'Hide Trailers' : 'Show Trailers'}
	</button>

	{#if trailersVisible}
		<div class="mt-2 flex w-full flex-col gap-3">
			{#if !trailersLoaded}
				<p class="text-sm text-c-neutral-5">Loading...</p>
			{:else if trailers.length === 0}
				<p class="text-sm text-c-neutral-5">No trailers found.</p>
			{:else}
				{#each trailers as trailer (trailer.key)}
					<div class="flex flex-col gap-1">
						<p class="text-xs font-semibold text-c-neutral-6">{trailer.name}</p>
						<iframe
							src="https://www.youtube.com/embed/{trailer.key}"
							title={trailer.name}
							class="w-full rounded-lg"
							style="aspect-ratio: 16/9;"
							allowfullscreen
						></iframe>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</DetailModal>
