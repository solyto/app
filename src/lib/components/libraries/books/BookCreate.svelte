<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import DateInput from '$lib/components/forms/DateInput.svelte';
	import MultiSelect from '$lib/components/forms/MultiSelect.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import type { Book, CreateBookRequest, UpdateBookRequest } from '$lib/types/library_book';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { getAuth } from '$lib/state/Auth.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getTags } from '$lib/state/Tags.svelte.js';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import { getBookLibrary } from '$lib/state/BookLibrary.svelte';
	import CreateModal from '$lib/components/libraries/shared/CreateModal.svelte';
	import HardcoverImportButton from '$lib/components/ui/buttons/HardcoverImportButton.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import GoodreadsImportButton from '$lib/components/ui/buttons/GoodreadsImportButton.svelte';

	const ts = getTranslation();
	const library = getBookLibrary();
	const tags = getTags();
	const auth = getAuth();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let activeEntry = $state<Book | null>(library.activeEntry);

	let titleInput = $state<HTMLInputElement | null>(null);
	let titleValue = $state<string>(activeEntry ? activeEntry.title : '');
	let authorValue = $state<string>(activeEntry ? activeEntry.author : '');
	let seriesValue = $state<string>(activeEntry ? activeEntry.series : '');
	let volumeValue = $state<string>(activeEntry ? activeEntry.volume : '');
	let coverValue = $state<string>('');
	let linkValue = $state<string>(activeEntry ? activeEntry.link : '');
	let publicationYearValue = $state<string>(activeEntry ? activeEntry.publication_year : '');
	let pagesValue = $state<string>(activeEntry ? activeEntry.pages : '');
	let currentPageValue = $state<string>(activeEntry ? activeEntry.current_page : '');
	let lentToValue = $state<string>(activeEntry ? activeEntry.lent_to : '');
	let isWhereValue = $state<string>(activeEntry ? activeEntry.is_where : '');
	let startedAtValue = $state<string>(
		activeEntry ? activeEntry.started_at?.substring(0, 10) : ''
	);
	let finishedAtValue = $state<string>(
		activeEntry ? activeEntry.finished_at?.substring(0, 10) : ''
	);
	let selectedGenres = $state(
		activeEntry
			? activeEntry.genres.map((genre) => ({ label: genre.title, value: genre.id }))
			: []
	);
	let selectedTags = $state(
		activeEntry ? activeEntry.tags.map((tag) => ({ label: tag.name, value: tag.id })) : []
	);
	let selectedRating = $state(activeEntry ? activeEntry.rating : 0);
	let isWishlist = $state<boolean>(activeEntry ? activeEntry.wishlist : false);
	let summaryValue = $state<string>(activeEntry ? activeEntry.summary : '');
	let linkInput = $state<HTMLInputElement | null>(null);
	let importLoading = $state<boolean>(false);

	const genreOptions: { label: string; value: string }[] = library.genres.map((genre) => ({
		label: genre.title,
		value: genre.id
	}));

	const tagOptions: { label: string; value: string }[] = tags.tags.map((tag) => ({
		label: tag.name,
		value: tag.id.toString()
	}));

	async function onsubmit(): Promise<void> {
		if (activeEntry) {
			return await update();
		} else {
			return await create();
		}
	}

	async function create(): Promise<void> {
		loadingIndicator.start();

		const request: CreateBookRequest = {
			title: titleValue,
			author: authorValue,
			series: seriesValue !== '' ? seriesValue : null,
			volume: volumeValue !== '' ? parseInt(volumeValue) : null,
			pages: pagesValue !== '' ? parseInt(pagesValue) : null,
			current_page: currentPageValue !== '' ? parseInt(currentPageValue) : null,
			publication_year: publicationYearValue !== '' ? parseInt(publicationYearValue) : null,
			lent_to: lentToValue !== '' ? lentToValue : null,
			is_where: isWhereValue !== '' ? isWhereValue : null,
			started_at: startedAtValue !== '' ? startedAtValue : null,
			finished_at: finishedAtValue !== '' ? finishedAtValue : null,
			wishlist: isWishlist ? isWishlist : false,
			summary: summaryValue !== '' ? summaryValue : null,
			genres: selectedGenres.length > 0 ? selectedGenres.map((genre) => genre.value) : null,
			tags: selectedTags.length > 0 ? selectedTags.map((tag) => tag.value) : null,
			rating: selectedRating > 0 ? selectedRating : null,
			cover_path: coverValue != '' ? coverValue : null,
			link: linkValue != '' ? linkValue : null
		};
		const ok = await library.create(request);
		if (ok) {
			titleValue = '';
			authorValue = '';
			seriesValue = '';
			volumeValue = '';
			pagesValue = '';
			currentPageValue = '';
			lentToValue = '';
			isWhereValue = '';
			startedAtValue = '';
			finishedAtValue = '';
			coverValue = '';
			linkValue = '';
			selectedGenres = [];
			isWishlist = false;
			summaryValue = '';
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.books.create_error);
		}

		loadingIndicator.stop();
	}

	async function update(): Promise<void> {
		loadingIndicator.start();

		const request: UpdateBookRequest = {
			title: titleValue,
			author: authorValue,
			series: seriesValue !== '' ? seriesValue : null,
			volume: volumeValue !== '' ? parseInt(volumeValue) : null,
			pages: pagesValue !== '' ? parseInt(pagesValue) : null,
			current_page: currentPageValue !== '' ? parseInt(currentPageValue) : null,
			publication_year: publicationYearValue !== '' ? parseInt(publicationYearValue) : null,
			lent_to: lentToValue !== '' ? lentToValue : null,
			is_where: isWhereValue !== '' ? isWhereValue : null,
			started_at: startedAtValue !== '' ? startedAtValue : null,
			finished_at: finishedAtValue !== '' ? finishedAtValue : null,
			wishlist: isWishlist ? isWishlist : false,
			summary: summaryValue !== '' ? summaryValue : null,
			genres: selectedGenres.length > 0 ? selectedGenres.map((genre) => genre.value) : null,
			tags: selectedTags.length > 0 ? selectedTags.map((tag) => tag.value) : null,
			rating: selectedRating > 0 ? selectedRating : null,
			...(coverValue !== '' ? { cover_path: coverValue } : {}),
			link: linkValue != '' ? linkValue : null
		};
		const ok = await library.update(activeEntry, request);
		if (ok) {
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.books.update_error);
		}

		loadingIndicator.stop();
	}

	async function importFromHardcover(): Promise<void> {
		if (linkValue === '') {
			linkInput?.focus();
			return;
		}

		if (!linkValue.includes('hardcover.app')) {
			notifications.error(ts.get.libraries.books.hardcover_import_validation_error);
			return;
		}

		importLoading = true;
		loadingIndicator.start();
		const book = await library.importFromHardcover(linkValue);

		if (!book) {
			notifications.error(ts.get.libraries.books.import_error);
			loadingIndicator.stop();
			importLoading = false;
			return;
		}

		authorValue = book.author;
		titleValue = book.title;
		coverValue = book.cover;
		publicationYearValue = book.release_date.slice(0, 4);
		pagesValue = book.page_count;

		importLoading = false;
		loadingIndicator.stop();
	}

	async function importFromGoodreads(): Promise<void> {
		if (linkValue === '') {
			linkInput?.focus();
			return;
		}

		if (!linkValue.includes('goodreads.com')) {
			notifications.error(ts.get.libraries.books.goodreads_import_validation_error);
			return;
		}

		importLoading = true;
		loadingIndicator.start();
		const book = await library.importFromGoodreads(linkValue);

		if (!book) {
			notifications.error(ts.get.libraries.books.import_error);
			loadingIndicator.stop();
			importLoading = false;
			return;
		}

		authorValue = book.author;
		titleValue = book.title;
		coverValue = book.cover;
		publicationYearValue = book.release_date.slice(0, 4);
		pagesValue = book.page_count;

		importLoading = false;
		loadingIndicator.stop();
	}
</script>

<CreateModal
	title={activeEntry !== null
		? ts.get.libraries.books.edit_book
		: ts.get.libraries.books.add_book}
	{library}
	existingCover={activeEntry
		? `${API_USER_STORAGE_URL}/${auth?.user.id}/${library.config.type}/${activeEntry.cover}`
		: null}
	newCover={coverValue}
	bind:selectedRating
	bind:isWishlist
>
	<ModalFormRow label={ts.get.libraries.books.title}>
		<TextInput bind:input={titleInput} bind:value={titleValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.author}>
		<TextInput bind:value={authorValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.series}>
		<div class="flex w-full gap-2">
			<TextInput bind:value={seriesValue} />
			<NumberInput bind:value={volumeValue} width={20} />
		</div>
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.genres}>
		<MultiSelect bind:value={selectedGenres} options={genreOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.tags}>
		<MultiSelect bind:value={selectedTags} options={tagOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.publication_year}>
		<NumberInput bind:value={publicationYearValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.pages}>
		<TextInput bind:value={pagesValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.current_page}>
		<TextInput bind:value={currentPageValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.lent_to}>
		<TextInput bind:value={lentToValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.is_where}>
		<TextInput bind:value={isWhereValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.started_at}>
		<DateInput bind:value={startedAtValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.finished_at}>
		<DateInput bind:value={finishedAtValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.cover}>
		<TextInput bind:value={coverValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.link}>
		<TextInput bind:value={linkValue} bind:input={linkInput} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.summary}>
		<TextInput multiLine={true} height={80} bind:value={summaryValue} />
	</ModalFormRow>
	<div class="mt-8 flex w-full flex-row items-center justify-end gap-6">
		<HardcoverImportButton loading={importLoading} onClick={importFromHardcover} />
		<GoodreadsImportButton loading={importLoading} onClick={importFromGoodreads} />
		<Button title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
