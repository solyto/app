<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import IconUser from '@lucide/svelte/icons/user';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { urls } from '$lib/config/urls';
	import type { BookLibrary } from '$lib/state/BookLibrary.svelte';
	import type { Author } from '$lib/types/library_book';

	const ts = getTranslation();
	const auth = getAuth();

	let { library } = $props<{ library: BookLibrary }>();

	function openAuthor(author: Author): void {
		goto(resolve(urls.bookAuthor, { id: author.id.toString() }));
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-row items-center gap-2">
		<button
			class="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-bold transition-all hover:bg-c-neutral-1 dark:hover:bg-s-dark-3"
			class:bg-c-neutral-1={!library.authorFavoritesFilter}
			class:dark:bg-s-dark-3={!library.authorFavoritesFilter}
			class:text-c-heading={!library.authorFavoritesFilter}
			class:dark:text-c-primary={!library.authorFavoritesFilter}
			onclick={() => {
				if (library.authorFavoritesFilter) library.toggleAuthorFavoritesFilter();
			}}
		>
			{ts.get.libraries.books.author_all}
		</button>
		<button
			class="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-bold transition-all hover:bg-c-neutral-1 dark:hover:bg-s-dark-3"
			class:bg-c-neutral-1={library.authorFavoritesFilter}
			class:dark:bg-s-dark-3={library.authorFavoritesFilter}
			class:text-c-heading={library.authorFavoritesFilter}
			class:dark:text-c-primary={library.authorFavoritesFilter}
			onclick={() => {
				if (!library.authorFavoritesFilter) library.toggleAuthorFavoritesFilter();
			}}
		>
			{ts.get.libraries.books.author_favorites_only}
		</button>
	</div>

	{#if library.authorsLoaded && library.filteredAuthors.length === 0}
		<p class="text-c-neutral-5 dark:text-c-neutral-4">
			{ts.get.libraries.books.author_no_authors}
		</p>
	{:else}
		<div class="flex w-full flex-row flex-wrap gap-4">
			{#each library.filteredAuthors as author (author.id)}
				<button
					onclick={() => openAuthor(author)}
					class="flex w-32 cursor-pointer flex-col items-center gap-2 rounded-sm bg-c-bg-surface p-2 text-center drop-shadow-sm transition-all not-dark:border-1 not-dark:border-c-neutral-1 hover:bg-c-neutral hover:drop-shadow-xl dark:hover:bg-s-dark-3"
				>
					<div
						class="relative flex size-24 items-center justify-center overflow-hidden rounded-full bg-c-neutral-2 dark:bg-s-dark-2"
					>
						{#if author.photo}
							<img
								src={`${API_USER_STORAGE_URL}/${auth.user?.id}/authors/${author.photo}`}
								alt={author.name}
								class="h-full w-full object-cover"
							/>
						{:else}
							<IconUser class="size-10 text-c-neutral-4" />
						{/if}
					</div>
					<div class="w-full truncate text-sm font-bold">{author.name}</div>
					<div class="text-xs text-c-neutral-5 dark:text-c-neutral-4">
						{author.books_count ?? 0}
						{ts.get.libraries.books.author_books}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
