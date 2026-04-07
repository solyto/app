<script lang="ts">
	import { fade } from 'svelte/transition';
	import { getNotes } from '$lib/state/Notes.svelte';
	import IconFunnel from '@lucide/svelte/icons/funnel';
	import IconX from '@lucide/svelte/icons/x';
	import NoteNavigationCategoryRenderer from '$lib/components/notes/NoteNavigationCategoryRenderer.svelte';
	import NoteNavigationNoteRenderer from '$lib/components/notes/NoteNavigationNoteRenderer.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { urls } from '$lib/config/urls';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import AddButton from '$lib/components/ui/buttons/AddButton.svelte';
	import AddNoteButton from '$lib/components/notes/AddNoteButton.svelte';
	import AddFolderButton from '$lib/components/notes/AddFolderButton.svelte';
	import CloseButton from '$lib/components/ui/buttons/CloseButton.svelte';
	import NoteNavigationFavoriteNoteRenderer from '$lib/components/notes/NoteNavigationFavoriteNoteRenderer.svelte';

	const ts = getTranslation();
	const notes = getNotes();

	let navigation = $state<HTMLDivElement | null>(null);
	let favorites = $derived(notes.getFavorites());

	function toggleMobile(): void {
		if (navigation) {
			navigation.style.display = 'block';
		}
	}

	function handleNavigation(): void {
		if (navigation && navigation.style.display === 'block') {
			navigation.style.display = 'none';
		}
	}
</script>

<button
	class="absolute top-4 left-4 z-20 cursor-pointer rounded-lg p-3 not-dark:bg-c-neutral-1 hover:bg-c-neutral-2 lg:hidden dark:bg-s-dark-2 dark:hover:bg-s-dark-3"
	onclick={toggleMobile}
>
	<IconFunnel />
</button>
<div
	in:fade
	class="absolute z-20 hidden h-full max-h-screen w-full flex-col overflow-y-auto bg-c-bg p-2 text-sm drop-shadow-xl sm:relative sm:flex sm:w-96 sm:p-4 dark:border-r-1 dark:border-s-dark-2 dark:drop-shadow-sm dark:drop-shadow-s-dark-shadow"
	bind:this={navigation}
>
	<div class="absolute top-2 right-2 flex gap-1">
		<div class="flex gap-1">
			<AddNoteButton
				onClick={() => {
					notes.openModal('note');
				}}
			/>
			<AddFolderButton
				onClick={() => {
					notes.openModal('category');
				}}
			/>
		</div>
		<div class="md:hidden">
			<CloseButton onClick={() => handleNavigation()} inModal={false} />
		</div>
	</div>
	<div class="mb-4 text-2xl font-bold 2xl:font-normal">{ts.get.notes.notebook}</div>
	{#if favorites && favorites.length > 0}
		<div class="mb-4 flex flex-col gap-1">
			<div class="mb-1 text-xl">{ts.get.notes.favorites}</div>
			<NoteNavigationFavoriteNoteRenderer {favorites} {handleNavigation} />
		</div>
	{/if}
	{#each notes.categories as category (category.id)}
		<NoteNavigationCategoryRenderer {category} depth={0} {handleNavigation} />
	{/each}
	{#if notes.notes.length > 0}
		<div
			class="min-h-8 rounded-lg transition-all"
			ondragover={(e: DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
				notes.dragTarget = null;
			}}
			ondragenter={() => (notes.dragTarget = null)}
			ondragleave={() => (notes.dragTarget = null)}
			ondrop={(e: DragEvent) => {
				e.preventDefault();
				notes.dragToCategory();
			}}
			class:bg-d-lightblue={notes.draggedNote !== null && notes.dragTarget === null}
			class:animate-pulse={notes.draggedNote !== null && notes.dragTarget === null}
			role="region"
			aria-label="No Category"
		>
			<NoteNavigationNoteRenderer categoryId={null} depth={0} {handleNavigation} />
		</div>
	{/if}
	{#if notes.categories.length === 0 && notes.notes.length === 0}
		<span class="text-md font-bold">{ts.get.notes.no_entries}</span>
	{/if}
</div>
