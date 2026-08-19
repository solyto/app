<script lang="ts">
	import Header from '$lib/components/libraries/shared/Header.svelte';
	import BookCreate from '$lib/components/libraries/books/BookCreate.svelte';
	import Entries from '$lib/components/libraries/shared/Entries.svelte';
	import GenreModal from '$lib/components/libraries/shared/GenreModal.svelte';
	import BookDetail from '$lib/components/libraries/books/BookDetail.svelte';
	import AuthorsView from '$lib/components/libraries/books/AuthorsView.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import { getBookLibrary } from '$lib/state/BookLibrary.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';

	const library = getBookLibrary();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let authorNameInput = $state<HTMLInputElement | null>(null);
	let authorNameValue = $state<string>('');

	async function createAuthor(): Promise<void> {
		if (authorNameValue.trim() === '') return;

		loadingIndicator.start();
		const author = await library.createAuthorAndNavigate(authorNameValue.trim());
		loadingIndicator.stop();

		if (author) {
			authorNameValue = '';
		} else {
			notifications.error(ts.get.libraries.books.author_create_error);
		}
	}
</script>

<div class="h-full max-h-full w-full overflow-y-auto p-4">
	<Header {library} />
	{#if library.createModalVisible}
		<BookCreate />
	{/if}
	{#if library.detailModalVisible}
		<BookDetail />
	{/if}
	{#if library.genreModalVisible}
		<GenreModal {library} />
	{/if}
	{#if library.authorCreatePromptVisible}
		<ConfirmationModal
			title={ts.get.libraries.books.add_author}
			onConfirm={createAuthor}
			onCancel={() => library.closeAuthorCreatePrompt()}
		>
			<TextInput
				bind:input={authorNameInput}
				bind:value={authorNameValue}
				placeholder={ts.get.libraries.books.author_name}
				onblur={() => {}}
			/>
		</ConfirmationModal>
	{/if}
	{#if library.view === 'authors'}
		<AuthorsView {library} />
	{:else}
		<Entries {library} />
	{/if}
</div>
