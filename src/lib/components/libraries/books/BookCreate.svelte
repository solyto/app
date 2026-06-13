<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import DateInput from '$lib/components/forms/DateInput.svelte';
	import MultiSelect from '$lib/components/forms/MultiSelect.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import type { Book, CreateBookRequest, UpdateBookRequest } from '$lib/types/library_book';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getTags } from '$lib/state/Tags.svelte';
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
	let seriesValue = $state<string>(activeEntry?.series ?? '');
	let volumeValue = $state<number | null>(activeEntry?.volume ?? null);
	let coverValue = $state<string>('');
	let linkValue = $state<string>(activeEntry?.link ?? '');
	let publicationYearValue = $state<number | null>(activeEntry?.publication_year ?? null);
	let pagesValue = $state<string>(activeEntry?.pages?.toString() ?? '');
	let currentPageValue = $state<string>(activeEntry?.current_page?.toString() ?? '');
	let lentToValue = $state<string>(activeEntry?.lent_to ?? '');
	let isWhereValue = $state<string>(activeEntry?.is_where ?? '');
	let startedAtValue = $state<string>(activeEntry?.started_at?.substring(0, 10) ?? '');
	let finishedAtValue = $state<string>(activeEntry?.finished_at?.substring(0, 10) ?? '');
	let selectedGenres = $state<string[]>(
		activeEntry ? activeEntry.genres.map((g) => g.id.toString()) : []
	);
	let selectedTags = $state<string[]>(
		activeEntry ? activeEntry.tags.map((t) => t.id.toString()) : []
	);
	let selectedRating = $state(activeEntry?.rating ?? 0);
	let isWishlist = $state<boolean>(activeEntry ? activeEntry.wishlist : false);
	let summaryValue = $state<string>(activeEntry?.summary ?? '');
	let linkInput = $state<HTMLInputElement | null>(null);
	let importLoading = $state<boolean>(false);

	const genreOptions: { label: string; value: string }[] = library.genres.map((genre) => ({
		label: genre.title,
		value: genre.id.toString()
	}));

	const tagOptions: { label: string; value: string }[] = tags.tags.map((tag) => ({
		label: tag.name,
		value: tag.id.toString()
	}));

	function buildRequestFields() {
		return {
			title: titleValue,
			author: authorValue,
			series: seriesValue !== '' ? seriesValue : null,
			volume: volumeValue,
			pages: pagesValue !== '' ? parseInt(pagesValue) : null,
			current_page: currentPageValue !== '' ? parseInt(currentPageValue) : null,
			publication_year: publicationYearValue,
			lent_to: lentToValue !== '' ? lentToValue : null,
			is_where: isWhereValue !== '' ? isWhereValue : null,
			started_at: startedAtValue !== '' ? startedAtValue : null,
			finished_at: finishedAtValue !== '' ? finishedAtValue : null,
			wishlist: isWishlist,
			summary: summaryValue !== '' ? summaryValue : null,
			genres: selectedGenres.map((v) => parseInt(v)),
			tags: selectedTags.map((v) => parseInt(v)),
			rating: selectedRating > 0 ? selectedRating : null,
			link: linkValue !== '' ? linkValue : null
		};
	}

	async function onsubmit(): Promise<void> {
		loadingIndicator.start();

		if (activeEntry) {
			const request: UpdateBookRequest = {
				...buildRequestFields(),
				...(coverValue !== '' ? { cover_path: coverValue } : {})
			};
			const ok = await library.update(activeEntry, request);
			if (ok) {
				library.closeCreateModal();
				await library.load();
			} else {
				notifications.error(ts.get.libraries.books.update_error);
			}
		} else {
			const request: CreateBookRequest = {
				...buildRequestFields(),
				cover_path: coverValue !== '' ? coverValue : null
			};
			const ok = await library.create(request);
			if (ok) {
				titleValue = '';
				authorValue = '';
				seriesValue = '';
				volumeValue = null;
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
		}

		loadingIndicator.stop();
	}

	async function importFrom(from: 'hardcover' | 'goodreads'): Promise<void> {
		if (linkValue === '') {
			linkInput?.focus();
			return;
		}

		if (from === 'hardcover' && !linkValue.includes('hardcover.app')) {
			notifications.error(ts.get.libraries.books.hardcover_import_validation_error);
			return;
		} else if (from === 'goodreads' && !linkValue.includes('goodreads.com')) {
			notifications.error(ts.get.libraries.books.goodreads_import_validation_error);
			return;
		}

		importLoading = true;
		loadingIndicator.start();

		const book = from === 'hardcover' ?
			await library.importFromHardcover(linkValue) :
			await library.importFromGoodreads(linkValue);

		if (!book) {
			notifications.error(ts.get.libraries.books.import_error);
			loadingIndicator.stop();
			importLoading = false;
			return;
		}

		authorValue = book.author;
		titleValue = book.title;
		coverValue = book.cover ?? '';
		publicationYearValue = parseInt(book.release_date.slice(0, 4));
		pagesValue = book.page_count?.toString() ?? '';

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
		? `${API_USER_STORAGE_URL}/${auth.user?.id}/${library.config.type}/${activeEntry.cover}`
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
			<NumberInput bind:value={volumeValue} />
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
		<TextInput bind:value={coverValue} placeholder="https://" />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.link}>
		<TextInput bind:value={linkValue} bind:input={linkInput} placeholder="https://" />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.books.summary}>
		<TextInput multiLine={true} height={80} bind:value={summaryValue} />
	</ModalFormRow>
	<div class="mt-8 flex w-full flex-row items-center justify-end gap-6">
		<HardcoverImportButton loading={importLoading} onClick={() => importFrom('hardcover')} />
		<GoodreadsImportButton loading={importLoading} onClick={() => importFrom('goodreads')} />
		<TextButton title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
