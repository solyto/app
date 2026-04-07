<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import DateInput from '$lib/components/forms/DateInput.svelte';
	import MultiSelect from '$lib/components/forms/MultiSelect.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { getAuth } from '$lib/state/Auth.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getTags } from '$lib/state/Tags.svelte.js';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import type { CreateMovieRequest, Movie, UpdateMovieRequest } from '$lib/types/library_movie';
	import CreateModal from '$lib/components/libraries/shared/CreateModal.svelte';
	import { getMovieLibrary } from '$lib/state/MovieLibrary.svelte';
	import ImdbImportButton from '$lib/components/ui/buttons/ImdbImportButton.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';

	const ts = getTranslation();
	const notifications = getUiNotifications();
	const library = getMovieLibrary();
	const tags = getTags();
	const auth = getAuth();
	const loadingIndicator = getLoadingIndicator();

	let activeEntry = $state<Movie | null>(library.activeEntry);

	let titleValue = $state<string>(activeEntry ? activeEntry.title : '');
	let coverValue = $state<string>('');
	let linkValue = $state<string>(activeEntry ? activeEntry.link : '');
	let publicationYearValue = $state<string>(activeEntry ? activeEntry.publication_year : '');
	let startedAtValue = $state<string>(
		activeEntry ? activeEntry.started_at?.substring(0, 10) : ''
	);
	let finishedAtValue = $state<string>(
		activeEntry ? activeEntry.finished_at?.substring(0, 10) : ''
	);
	let categoryValue = $state<string>(activeEntry ? activeEntry.category : 'movie');
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

	const categoryOptions: { label: string; value: string }[] = [
		{ label: ts.get.libraries.movies.category_movie, value: 'movie' },
		{ label: ts.get.libraries.movies.category_series, value: 'series' }
	];

	async function onsubmit(): Promise<void> {
		if (activeEntry) {
			return await update();
		} else {
			return await create();
		}
	}

	async function create(): Promise<void> {
		loadingIndicator.start();

		const request: CreateMovieRequest = {
			title: titleValue,
			category: categoryValue,
			publication_year: publicationYearValue !== '' ? parseInt(publicationYearValue) : null,
			started_at: startedAtValue !== '' ? startedAtValue : null,
			finished_at: finishedAtValue !== '' ? finishedAtValue : null,
			wishlist: isWishlist ? isWishlist : false,
			genres: selectedGenres.length > 0 ? selectedGenres.map((genre) => genre.value) : null,
			tags: selectedTags.length > 0 ? selectedTags.map((tag) => tag.value) : null,
			rating: selectedRating > 0 ? selectedRating : null,
			cover_path: coverValue != '' ? coverValue : null,
			link: linkValue != '' ? linkValue : null
		};
		const ok = await library.create(request);
		if (ok) {
			titleValue = '';
			categoryValue = '';
			startedAtValue = '';
			finishedAtValue = '';
			coverValue = '';
			linkValue = '';
			selectedGenres = [];
			isWishlist = false;
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.movies.create_error);
		}

		loadingIndicator.stop();
	}

	async function update(): Promise<void> {
		loadingIndicator.start();

		const request: UpdateMovieRequest = {
			title: titleValue,
			category: categoryValue,
			publication_year: publicationYearValue !== '' ? parseInt(publicationYearValue) : null,
			started_at: startedAtValue !== '' ? startedAtValue : null,
			finished_at: finishedAtValue !== '' ? finishedAtValue : null,
			wishlist: isWishlist ? isWishlist : false,
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
			notifications.error(ts.get.libraries.movies.update_error);
		}

		loadingIndicator.stop();
	}

	async function importFromImdb(): Promise<void> {
		if (linkValue === '') {
			linkInput?.focus();
			return;
		}

		if (!linkValue.includes('imdb.com')) {
			notifications.error(ts.get.libraries.movies.imdb_import_validation_error);
			return;
		}

		importLoading = true;
		loadingIndicator.start();
		const movie = await library.importFromImdb(linkValue);

		if (!movie) {
			notifications.error(ts.get.libraries.movies.import_error);
			loadingIndicator.stop();
			importLoading = false;
			return;
		}

		titleValue = movie.title;
		coverValue = movie.cover;
		publicationYearValue = movie.release_year.toString();

		if (movie.type === 'tvSeries') {
			categoryValue = 'series';
		} else if (movie.type === 'movie') {
			categoryValue = 'movie';
		}

		if (movie.genres.length > 0) {
			for (const genre of movie.genres) {
				const existing = library.genres.find((g) => g.title === genre);

				if (!existing) {
					continue;
				}

				selectedGenres.push({ label: genre, value: existing.id });
			}
		}

		loadingIndicator.stop();
		importLoading = false;
	}
</script>

<CreateModal
	title={activeEntry !== null
		? ts.get.libraries.movies.edit_movie
		: ts.get.libraries.movies.add_movie}
	{library}
	existingCover={activeEntry
		? `${API_USER_STORAGE_URL}/${auth?.user.id}/${library.config.type}/${activeEntry.cover}`
		: null}
	newCover={coverValue}
	bind:selectedRating
	bind:isWishlist
>
	<ModalFormRow label={ts.get.libraries.books.title}>
		<TextInput bind:value={titleValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.movies.category}>
		<Select bind:value={categoryValue} options={categoryOptions} />
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
	<div class="mt-8 flex w-full flex-row items-center justify-end gap-6">
		<ImdbImportButton loading={importLoading} onClick={importFromImdb} />
		<Button title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
