<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import IconGripVertical from '@lucide/svelte/icons/grip-vertical';
	import MissingCover from '$lib/components/libraries/shared/MissingCover.svelte';
	import CoverImage from '$lib/components/libraries/shared/CoverImage.svelte';
	import VideoEntry from '$lib/components/libraries/videos/VideoEntry.svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { getAuth } from '$lib/state/Auth.svelte';
	import type { VideoLibrary } from '$lib/state/VideoLibrary.svelte';
	import type { Video } from '$lib/types/library_video';

	let { library } = $props<{ library: VideoLibrary }>();

	const auth = getAuth();
	const flipDurationMs = 200;

	let view = $derived(library.view);
	let items = $state<Video[]>([]);
	let dragDisabled = $state(true);

	$effect(() => {
		items = library.filteredEntries;
	});

	function previewFilename(cover: string): string {
		const dot = cover.lastIndexOf('.');
		return dot === -1 ? cover + '_preview' : cover.slice(0, dot) + '_preview' + cover.slice(dot);
	}

	function handleConsider(e: CustomEvent) {
		items = e.detail.items;
	}

	async function handleFinalize(e: CustomEvent) {
		items = e.detail.items;
		dragDisabled = true;
		await library.reorder(items.map((entry: Video) => entry.id));
	}
</script>

<div
	use:dndzone={{
		items,
		flipDurationMs,
		dragDisabled,
		dropTargetClasses: ['ring-2', 'ring-c-primary']
	}}
	onconsider={handleConsider}
	onfinalize={handleFinalize}
	class="flex w-full flex-wrap !outline-0"
	class:md:p-2={view === 'list'}
	class:flex-col={view === 'list'}
	class:gap-2={view === 'list'}
	class:flex-row={view === 'cards'}
	class:gap-4={view === 'cards'}
	class:items-start={view === 'cards'}
>
	{#each items as entry (entry.id)}
		<a
			href={entry.url}
			target="_blank"
			draggable="true"
			ondragstart={() => {
				library.draggedEntry = entry;
			}}
			ondragend={() => {
				library.draggedEntry = null;
				library.dragTarget = null;
			}}
			class="max-w-full max-md:w-full"
			animate:flip={{ duration: flipDurationMs }}
			transition:fade
		>
			<div
				class="relative flex touch-manipulation rounded-sm bg-c-bg-surface drop-shadow-sm transition-all not-dark:border-1 not-dark:border-c-neutral-1 hover:bg-c-neutral hover:drop-shadow-xl max-md:w-full dark:hover:bg-s-dark-3"
				class:flex-col={view === 'cards'}
				class:flex-row={view === 'list'}
				class:md:max-w-48={view === 'cards'}
				class:gap-1={view === 'list'}
			>
				<div
					class="flex items-center justify-start rounded-sm"
					class:max-h-16={view === 'list'}
					class:max-w-16={view === 'list'}
					class:md:max-w-48={view === 'cards'}
					class:max-md:justify-center={view === 'cards'}
				>
					<div class="relative flex h-full w-full items-center justify-center">
						<div
							class="relative flex h-full w-full items-center justify-center rounded-sm transition-all"
							class:md:w-48={view === 'cards'}
							class:min-h-48={view === 'cards'}
							class:max-md:w-full={view === 'cards'}
							class:size-16={view === 'list'}
						>
							<MissingCover {library} />
							{#if entry.cover}
								<CoverImage
									src={`${API_USER_STORAGE_URL}/${auth.user?.id}/${library.config.type}/${previewFilename(entry.cover)}`}
									alt=""
									class="pointer-events-none absolute inset-0 top-0 left-0 h-full w-full object-cover opacity-10 blur-xs"
								/>
								<CoverImage
									src={`${API_USER_STORAGE_URL}/${auth.user?.id}/${library.config.type}/${entry.cover}`}
									previewSrc={`${API_USER_STORAGE_URL}/${auth.user?.id}/${library.config.type}/${previewFilename(entry.cover)}`}
									alt="Thumbnail"
									class="z-30 h-full w-full rounded-sm object-cover"
								/>
							{/if}
						</div>
					</div>
				</div>
				<div
					class="flex flex-1 items-center p-2"
					class:flex-col={view === 'cards'}
					class:md:flex-row={view === 'list'}
					class:max-md:flex-col={view === 'list'}
					class:w-full={view === 'list'}
				>
					<VideoEntry {entry} {library} />
				</div>
				<div
					role="button"
					tabindex="0"
					class="flex cursor-grab touch-none items-center p-2 text-c-neutral-3"
					onpointerdown={(e: PointerEvent) => {
						e.preventDefault();
						e.stopPropagation();
						dragDisabled = false;
					}}
					onpointerup={() => (dragDisabled = true)}
				>
					<IconGripVertical size={16} class="shrink-0" />
				</div>
			</div>
		</a>
	{/each}
</div>
