<script lang="ts">
	import { scale } from 'svelte/transition';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import type { MusicLibrary } from '$lib/state/MusicLibrary.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import LoadingLogo from '$lib/components/ui/LoadingLogo.svelte';
	import type { BookLibrary } from '$lib/state/BookLibrary.svelte';
	import MusicRelease from '$lib/components/libraries/shared/MusicRelease.svelte';
	import BookRelease from '$lib/components/libraries/shared/BookRelease.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let { library } = $props<{ library: MusicLibrary | BookLibrary }>();

	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();

	let modalOpen = $state<boolean>(false);

	onMount(async () => {
		const showReleases = page.url.searchParams.get('releases');

		if (showReleases !== null) {
			toggleModal();
		}
	});

	async function toggleModal(): void {
		modalOpen = !modalOpen;

		if (modalOpen && !library.releasesLoaded) {
			loadingIndicator.start();
			await library.loadReleases();
			loadingIndicator.stop();
		}
	}
</script>

<button
	class="cursor-pointer rounded-sm bg-c-primary p-1 px-4 py-2 font-bold text-white transition-all hover:bg-c-success hover:shadow-xs"
	onclick={toggleModal}
>
	{ts.get.libraries.releases}
</button>

{#if modalOpen}
	<ContentModal title={ts.get.libraries.releases} onClose={toggleModal} transparent={true}>
		<div
			class="flex w-full flex-col items-start gap-4 overflow-y-auto pt-6 pb-4 md:max-h-[80vh]"
			in:scale
		>
			{#if !library.releasesLoaded}
				<LoadingLogo label={ts.get.libraries.releases_loading} />
			{:else}
				{#each library.releases as release (release.id)}
					{#if library.config.type === 'music'}
						<MusicRelease {release} {library} />
					{:else if library.config.type === 'books'}
						<BookRelease {release} {library} />
					{/if}
				{/each}
				{#if library.releases.length === 0}
					<div
						class="w-full rounded-lg border-1 border-c-neutral-1 bg-c-bg-surface p-4 text-left shadow-sm dark:border-s-dark-2"
						in:scale
					>
						{ts.get.libraries.releases_none}
					</div>
				{/if}
			{/if}
		</div>
	</ContentModal>
{/if}
