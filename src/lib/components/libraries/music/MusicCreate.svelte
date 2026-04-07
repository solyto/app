<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import MultiSelect from '$lib/components/forms/MultiSelect.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import type {
		CreateMusicRequest,
		DeezerImport,
		Music,
		UpdateMusicRequest
	} from '$lib/types/library_music';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { getAuth } from '$lib/state/Auth.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import { getMusicLibrary } from '$lib/state/MusicLibrary.svelte';
	import CreateModal from '$lib/components/libraries/shared/CreateModal.svelte';
	import DeezerImportButton from '$lib/components/ui/buttons/DeezerImportButton.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import DiscogsImportButton from '$lib/components/ui/buttons/DiscogsImportButton.svelte';

	const ts = getTranslation();
	const library = getMusicLibrary();
	const auth = getAuth();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let activeEntry = $state<Music | null>(library.activeEntry);

	let titleValue = $state<string>(activeEntry ? activeEntry.title : '');
	let artistValue = $state<string>(activeEntry ? activeEntry.artist : '');
	let publicationYearValue = $state<string>(activeEntry ? activeEntry.publication_year : '');
	let acquiredWhereValue = $state<string>(activeEntry ? activeEntry.acquired_where : '');
	let additionalInfoValue = $state<string>(activeEntry ? activeEntry.additional_info : '');
	let coverValue = $state<string>('');
	let linkValue = $state<string>(activeEntry ? activeEntry.link : '');
	let typeValue = $state<string>(activeEntry ? activeEntry.type : '');
	let formatValue = $state<string>(activeEntry ? activeEntry.format : '');
	let conditionValue = $state<string>(activeEntry ? activeEntry.condition : '');
	let selectedGenres = $state(
		activeEntry
			? activeEntry.genres.map((genre) => ({ label: genre.title, value: genre.id }))
			: []
	);
	let selectedRating = $state(activeEntry ? activeEntry.rating : 0);
	let isWishlist = $state<boolean>(activeEntry ? activeEntry.wishlist : false);
	let linkInput = $state<HTMLInputElement | null>(null);
	let importLoading = $state<boolean>(false);

	const typeOptions: { label: string; value: string }[] = [
		{ label: 'CD', value: 'cd' },
		{ label: 'Vinyl', value: 'vinyl' },
		{ label: 'Digital', value: 'digital' }
	];

	const formatOptions: { label: string; value: string }[] = [
		{ label: 'Album', value: 'album' },
		{ label: 'Single', value: 'single' },
		{ label: 'Compilation', value: 'compilation' }
	];

	const conditionOptions: { label: string; value: string }[] = [
		{ label: 'Mint', value: 'mint' },
		{ label: 'Very Good', value: 'very-good' },
		{ label: 'Good', value: 'good' },
		{ label: 'Medium', value: 'medium' },
		{ label: 'Poor', value: 'poor' },
		{ label: 'Very Poor', value: 'very-poor' }
	];

	const genreOptions: { label: string; value: string }[] = library.genres.map((genre) => ({
		label: genre.title,
		value: genre.id
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

		const request: CreateMusicRequest = {
			title: titleValue,
			artist: artistValue,
			genres: selectedGenres.length > 0 ? selectedGenres.map((genre) => genre.value) : null,
			type: typeValue !== '' ? typeValue : null,
			format: formatValue !== '' ? formatValue : null,
			condition: conditionValue != '' ? conditionValue : null,
			publication_year: publicationYearValue !== '' ? parseInt(publicationYearValue) : null,
			acquired_where: acquiredWhereValue != '' ? acquiredWhereValue : null,
			additional_info: additionalInfoValue != '' ? additionalInfoValue : null,
			wishlist: isWishlist ? isWishlist : false,
			rating: selectedRating > 0 ? selectedRating : null,
			cover_path: coverValue != '' ? coverValue : null,
			link: linkValue != '' ? linkValue : null
		};
		const ok = await library.create(request);
		if (ok) {
			titleValue = '';
			artistValue = '';
			selectedGenres = [];
			typeValue = '';
			formatValue = '';
			conditionValue = '';
			acquiredWhereValue = '';
			additionalInfoValue = '';
			coverValue = '';
			linkValue = '';
			isWishlist = false;
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.music.create_error);
		}

		loadingIndicator.stop();
	}

	async function update(): Promise<void> {
		loadingIndicator.start();

		const request: UpdateMusicRequest = {
			title: titleValue,
			artist: artistValue,
			genres: selectedGenres.length > 0 ? selectedGenres.map((genre) => genre.value) : null,
			type: typeValue !== '' ? typeValue : null,
			format: formatValue !== '' ? formatValue : null,
			condition: conditionValue != '' ? conditionValue : null,
			publication_year: publicationYearValue !== '' ? parseInt(publicationYearValue) : null,
			acquired_where: acquiredWhereValue != '' ? acquiredWhereValue : null,
			additional_info: additionalInfoValue != '' ? additionalInfoValue : null,
			wishlist: isWishlist ? isWishlist : false,
			rating: selectedRating > 0 ? selectedRating : null,
			...(coverValue !== '' ? { cover_path: coverValue } : {}),
			link: linkValue != '' ? linkValue : null
		};
		const ok = await library.update(activeEntry, request);
		if (ok) {
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.music.update_error);
		}

		loadingIndicator.stop();
	}

	async function importFromDeezer(): Promise<void> {
		if (linkValue === '') {
			linkInput?.focus();
			return;
		}

		if (!linkValue.includes('deezer.com')) {
			notifications.error(ts.get.libraries.music.deezer_import_validation_error);
			return;
		}

		importLoading = true;
		loadingIndicator.start();
		const album = await library.importFromDeezer(linkValue);

		if (!album) {
			notifications.error(ts.get.libraries.music.import_error);
			loadingIndicator.stop();
			importLoading = false;
			return;
		}

		artistValue = album.artist;
		titleValue = album.title;
		coverValue = album.cover;
		publicationYearValue = album.release_date.slice(0, 4);
		formatValue = album.record_type;

		if (album.genres.length > 0) {
			for (const genre of album.genres) {
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

	async function importFromDiscogs(): Promise<void> {
		if (linkValue === '') {
			linkInput?.focus();
			return;
		}

		if (!linkValue.includes('discogs.com')) {
			notifications.error(ts.get.libraries.music.discogs_import_validation_error);
			return;
		}

		importLoading = true;
		loadingIndicator.start();
		const album = await library.importFromDiscogs(linkValue);

		if (!album) {
			notifications.error(ts.get.libraries.music.import_error);
			loadingIndicator.stop();
			importLoading = false;
			return;
		}

		artistValue = album.artist;
		titleValue = album.title;
		coverValue = album.cover;

		if (album.release_date) {
			publicationYearValue = album.release_date.slice(0, 4);
		}

		if (album.genres.length > 0) {
			for (const genre of album.genres) {
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
		? ts.get.libraries.music.edit_album
		: ts.get.libraries.music.add_album}
	{library}
	existingCover={activeEntry && activeEntry.cover
		? `${API_USER_STORAGE_URL}/${auth?.user.id}/${library.config.type}/${activeEntry.cover}`
		: null}
	newCover={coverValue}
	bind:selectedRating
	bind:isWishlist
>
	<ModalFormRow label={ts.get.libraries.music.title}>
		<TextInput bind:value={titleValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.music.artist}>
		<TextInput bind:value={artistValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.genres}>
		<MultiSelect bind:value={selectedGenres} options={genreOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.music.type}>
		<Select bind:value={typeValue} options={typeOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.music.format}>
		<Select bind:value={formatValue} options={formatOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.music.condition}>
		<Select bind:value={conditionValue} options={conditionOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.publication_year}>
		<NumberInput bind:value={publicationYearValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.music.acquired_where}>
		<TextInput bind:value={acquiredWhereValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.music.additional_info}>
		<TextInput bind:value={additionalInfoValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.music.cover}>
		<TextInput bind:value={coverValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.music.link}>
		<TextInput bind:value={linkValue} bind:input={linkInput} />
	</ModalFormRow>
	<div class="mt-8 flex w-full flex-row items-center justify-end gap-6">
		<DiscogsImportButton loading={importLoading} onClick={importFromDiscogs} />
		<DeezerImportButton loading={importLoading} onClick={importFromDeezer} />
		<Button title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
