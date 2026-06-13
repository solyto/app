<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import DateInput from '$lib/components/forms/DateInput.svelte';
	import MultiSelect from '$lib/components/forms/MultiSelect.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getTags } from '$lib/state/Tags.svelte';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import Checkbox from '$lib/components/forms/Checkbox.svelte';
	import type { CreateGameRequest, Game, UpdateGameRequest } from '$lib/types/library_game';
	import CreateModal from '$lib/components/libraries/shared/CreateModal.svelte';
	import { getGameLibrary } from '$lib/state/GameLibrary.svelte';
	import SteamImportButton from '$lib/components/ui/buttons/SteamImportButton.svelte';
	import BggImportButton from '$lib/components/ui/buttons/BggImportButton.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';

	const ts = getTranslation();
	const library = getGameLibrary();
	const tags = getTags();
	const auth = getAuth();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let activeEntry = $state<Game | null>(library.activeEntry);

	let titleValue = $state<string>(activeEntry ? activeEntry.title : '');
	let coverValue = $state<string>('');
	let linkValue = $state<string>(activeEntry?.link ?? '');
	let publicationYearValue = $state<number | null>(activeEntry?.publication_year ?? null);
	let startedAtValue = $state<string>(activeEntry?.started_at?.substring(0, 10) ?? '');
	let finishedAtValue = $state<string>(activeEntry?.finished_at?.substring(0, 10) ?? '');
	let platformValue = $state<string>(activeEntry?.platform ?? 'pc');
	let developerValue = $state<string>(activeEntry?.developer ?? '');
	let publisherValue = $state<string>(activeEntry?.publisher ?? '');
	let playtimeHoursValue = $state<number | null>(activeEntry?.playtime_hours ?? null);
	let completedValue = $state<boolean>(activeEntry ? activeEntry.completed : false);
	let selectedGenres = $state<string[]>(
		activeEntry ? activeEntry.genres.map((g) => g.id.toString()) : []
	);
	let selectedTags = $state<string[]>(
		activeEntry ? activeEntry.tags.map((t) => t.id.toString()) : []
	);
	let selectedRating = $state(activeEntry?.rating ?? 0);
	let isWishlist = $state<boolean>(activeEntry ? activeEntry.wishlist : false);
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

	const platformOptions: { label: string; value: string }[] = [
		{ label: ts.get.libraries.games.platform_pc, value: 'pc' },
		{ label: ts.get.libraries.games.platform_playstation, value: 'playstation' },
		{ label: ts.get.libraries.games.platform_xbox, value: 'xbox' },
		{ label: ts.get.libraries.games.platform_nintendo, value: 'nintendo' },
		{ label: ts.get.libraries.games.platform_mobile, value: 'mobile' },
		{ label: ts.get.libraries.games.platform_boardgame, value: 'boardgame' },
		{ label: ts.get.libraries.games.platform_other, value: 'other' }
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

		const request: CreateGameRequest = {
			title: titleValue,
			platform: platformValue,
			developer: developerValue !== '' ? developerValue : null,
			publisher: publisherValue !== '' ? publisherValue : null,
			publication_year: publicationYearValue,
			playtime_hours: playtimeHoursValue,
			completed: completedValue,
			started_at: startedAtValue !== '' ? startedAtValue : null,
			finished_at: finishedAtValue !== '' ? finishedAtValue : null,
			wishlist: isWishlist,
			genres: selectedGenres.map((v) => parseInt(v)),
			tags: selectedTags.map((v) => parseInt(v)),
			rating: selectedRating > 0 ? selectedRating : null,
			cover_path: coverValue != '' ? coverValue : null,
			link: linkValue != '' ? linkValue : null
		};
		const ok = await library.create(request);
		if (ok) {
			titleValue = '';
			platformValue = 'pc';
			developerValue = '';
			publisherValue = '';
			playtimeHoursValue = null;
			publicationYearValue = null;
			completedValue = false;
			startedAtValue = '';
			finishedAtValue = '';
			coverValue = '';
			linkValue = '';
			selectedGenres = [];
			selectedTags = [];
			isWishlist = false;
			library.closeCreateModal();
			await library.load();
		}

		loadingIndicator.stop();
	}

	async function update(): Promise<void> {
		loadingIndicator.start();

		const request: UpdateGameRequest = {
			title: titleValue,
			platform: platformValue,
			developer: developerValue !== '' ? developerValue : null,
			publisher: publisherValue !== '' ? publisherValue : null,
			publication_year: publicationYearValue,
			playtime_hours: playtimeHoursValue,
			completed: completedValue,
			started_at: startedAtValue !== '' ? startedAtValue : null,
			finished_at: finishedAtValue !== '' ? finishedAtValue : null,
			wishlist: isWishlist,
			genres: selectedGenres.map((v) => parseInt(v)),
			tags: selectedTags.map((v) => parseInt(v)),
			rating: selectedRating > 0 ? selectedRating : null,
			...(coverValue !== '' ? { cover_path: coverValue } : {}),
			link: linkValue != '' ? linkValue : null
		};
		const ok = await library.update(activeEntry!, request);
		if (ok) {
			library.closeCreateModal();
			await library.load();
		}

		loadingIndicator.stop();
	}

	async function importFromSteam(): Promise<void> {
		if (linkValue === '') {
			linkInput?.focus();
			return;
		}

		if (!linkValue.includes('store.steampowered.com')) {
			notifications.error(ts.get.libraries.games.steam_import_validation_error);
			return;
		}

		importLoading = true;
		loadingIndicator.start();
		const game = await library.importFromSteam(linkValue);

		if (!game) {
			notifications.error(ts.get.libraries.games.import_error);
			loadingIndicator.stop();
			importLoading = false;
			return;
		}

		titleValue = game.title;
		coverValue = game.cover ?? '';
		developerValue = game.developer ?? '';
		publisherValue = game.publisher ?? '';

		if (game.release_date) {
			const year = game.release_date.match(/\d{4}/);
			if (year) {
				publicationYearValue = parseInt(year[0]);
			}
		}

		if (game.genres.length > 0) {
			for (const genre of game.genres) {
				const existing = library.genres.find((g) => g.title === genre);

				if (!existing) {
					continue;
				}

				selectedGenres.push(existing.id.toString());
			}
		}

		loadingIndicator.stop();
		importLoading = false;
	}

	async function importFromBgg(): Promise<void> {
		if (linkValue === '') {
			linkInput?.focus();
			return;
		}

		if (!linkValue.includes('boardgamegeek.com')) {
			notifications.error(ts.get.libraries.games.bgg_import_validation_error);
			return;
		}

		importLoading = true;
		loadingIndicator.start();
		const game = await library.importFromBgg(linkValue);

		if (!game) {
			notifications.error(ts.get.libraries.games.import_error);
			loadingIndicator.stop();
			importLoading = false;
			return;
		}

		titleValue = game.title;
		coverValue = game.cover ?? '';
		developerValue = game.designer ?? '';
		publisherValue = game.publisher ?? '';
		platformValue = 'boardgame';

		if (game.publication_year) {
			publicationYearValue = game.publication_year;
		}

		if (game.genres.length > 0) {
			for (const genre of game.genres) {
				const existing = library.genres.find((g) => g.title === genre);

				if (!existing) {
					continue;
				}

				selectedGenres.push(existing.id.toString());
			}
		}

		loadingIndicator.stop();
		importLoading = false;
	}
</script>

<CreateModal
	title={activeEntry !== null
		? ts.get.libraries.games.edit_game
		: ts.get.libraries.games.add_game}
	{library}
	existingCover={activeEntry
		? `${API_USER_STORAGE_URL}/${auth.user?.id}/${library.config.type}/${activeEntry.cover}`
		: null}
	newCover={coverValue}
	bind:selectedRating
	bind:isWishlist
>
	<ModalFormRow label={ts.get.libraries.games.title}>
		<TextInput bind:value={titleValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.games.platform}>
		<Select bind:value={platformValue} options={platformOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.games.creator}>
		<TextInput bind:value={developerValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.games.publisher}>
		<TextInput bind:value={publisherValue} />
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
	<ModalFormRow label={ts.get.libraries.games.playtime_hours}>
		<NumberInput bind:value={playtimeHoursValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.games.completed}>
		<Checkbox isChecked={completedValue} onchange={() => (completedValue = !completedValue)} class="pt-[9px]" />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.games.started_at}>
		<DateInput bind:value={startedAtValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.games.finished_at}>
		<DateInput bind:value={finishedAtValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.games.cover}>
		<TextInput bind:value={coverValue} placeholder="https://" />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.games.link}>
		<TextInput bind:value={linkValue} bind:input={linkInput} placeholder="https://" />
	</ModalFormRow>
	<div class="mt-8 flex w-full flex-row items-center justify-end gap-6">
		<BggImportButton loading={importLoading} onClick={importFromBgg} />
		<SteamImportButton loading={importLoading} onClick={importFromSteam} />
		<TextButton title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
