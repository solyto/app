<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { getAuth } from '$lib/state/Auth.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import type {
		CreateRecipeRequest,
		Recipe,
		RecipeType,
		UpdateRecipeRequest
	} from '$lib/types/library_recipe';
	import Select from '$lib/components/forms/Select.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import CreateModal from '$lib/components/libraries/shared/CreateModal.svelte';
	import { getRecipeLibrary } from '$lib/state/RecipeLibrary.svelte';
	import ChefkochImportButton from '$lib/components/ui/buttons/ChefkochImportButton.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';

	const ts = getTranslation();
	const library = getRecipeLibrary();
	const auth = getAuth();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let activeEntry = $state<Recipe | null>(library.activeEntry);

	let titleValue = $state<string>(activeEntry ? activeEntry.title : '');
	let descriptionValue = $state<string>(activeEntry ? activeEntry.description : '');
	let timeToMakeValue = $state<string>(activeEntry ? activeEntry.time_to_make : '');
	let ingredientsValue = $state<string>(activeEntry ? activeEntry.ingredients : '');
	let coverValue = $state<string>('');
	let linkValue = $state<string>(activeEntry ? activeEntry.link : '');
	let typeValue = $state<string>(activeEntry ? activeEntry.type : '');
	let selectedRating = $state(activeEntry ? activeEntry.rating : 0);
	let linkInput = $state<HTMLInputElement | null>(null);
	let importLoading = $state<boolean>(false);

	const typeOptions: { label: string; value: string }[] = [
		{ label: ts.get.libraries.recipes.type_breakfast, value: 'breakfast' },
		{ label: ts.get.libraries.recipes.type_lunch, value: 'lunch' },
		{ label: ts.get.libraries.recipes.type_dinner, value: 'dinner' },
		{ label: ts.get.libraries.recipes.type_snack, value: 'snack' },
		{ label: ts.get.libraries.recipes.type_dessert, value: 'dessert' },
		{ label: ts.get.libraries.recipes.type_drink, value: 'drink' },
		{ label: ts.get.libraries.recipes.type_other, value: 'other' }
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

		const request: CreateRecipeRequest = {
			title: titleValue,
			description: descriptionValue != '' ? descriptionValue : null,
			type: typeValue != '' ? (typeValue as RecipeType) : null,
			time_to_make: timeToMakeValue !== '' ? parseInt(timeToMakeValue) : null,
			ingredients: ingredientsValue !== '' ? ingredientsValue : null,
			rating: selectedRating > 0 ? selectedRating : null,
			cover_path: coverValue != '' ? coverValue : null,
			link: linkValue != '' ? linkValue : null
		};
		const ok = await library.create(request);
		if (ok) {
			titleValue = '';
			descriptionValue = '';
			timeToMakeValue = '';
			ingredientsValue = '';
			typeValue = '';
			coverValue = '';
			linkValue = '';
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.recipes.create_error);
		}

		loadingIndicator.stop();
	}

	async function update(): Promise<void> {
		loadingIndicator.start();

		const request: UpdateRecipeRequest = {
			title: titleValue,
			description: descriptionValue != '' ? descriptionValue : null,
			type: typeValue != '' ? (typeValue as RecipeType) : null,
			time_to_make: timeToMakeValue !== '' ? parseInt(timeToMakeValue) : null,
			ingredients: ingredientsValue !== '' ? ingredientsValue : null,
			rating: selectedRating > 0 ? selectedRating : null,
			...(coverValue !== '' ? { cover_path: coverValue } : {}),
			link: linkValue != '' ? linkValue : null
		};
		const ok = await library.update(activeEntry, request);
		if (ok) {
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.recipes.update_error);
		}

		loadingIndicator.stop();
	}

	async function importFromChefkoch(): Promise<void> {
		if (linkValue === '') {
			linkInput?.focus();
			return;
		}

		if (!linkValue.includes('chefkoch.de')) {
			notifications.error(ts.get.libraries.recipes.chefkoch_import_validation_error);
			return;
		}

		importLoading = true;
		loadingIndicator.start();
		const recipe = await library.importFromChefkoch(linkValue);

		if (!recipe) {
			notifications.error(ts.get.libraries.recipes.import_error);
			loadingIndicator.stop();
			importLoading = false;
			return;
		}

		titleValue = recipe.title;
		coverValue = recipe.cover;
		ingredientsValue = recipe.ingredients;
		descriptionValue = recipe.description;

		if (recipe.time_to_make) {
			timeToMakeValue = recipe.time_to_make.toString();
		}

		loadingIndicator.stop();
		importLoading = false;
	}
</script>

<CreateModal
	title={activeEntry !== null
		? ts.get.libraries.recipes.edit_recipe
		: ts.get.libraries.recipes.add_recipe}
	{library}
	existingCover={activeEntry
		? `${API_USER_STORAGE_URL}/${auth?.user.id}/${library.config.type}/${activeEntry.cover}`
		: null}
	newCover={coverValue}
	bind:selectedRating
>
	<ModalFormRow label={ts.get.libraries.recipes.title}>
		<TextInput bind:value={titleValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.recipes.type}>
		<Select bind:value={typeValue} options={typeOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.recipes.ingredients}>
		<TextInput bind:value={ingredientsValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.recipes.time_to_make}>
		<NumberInput bind:value={timeToMakeValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.recipes.cover}>
		<TextInput bind:value={coverValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.recipes.link}>
		<TextInput bind:value={linkValue} bind:input={linkInput} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.recipes.description}>
		<TextInput bind:value={descriptionValue} multiLine={true} height={150} />
	</ModalFormRow>
	<div class="mt-8 flex w-full flex-row items-center justify-end gap-6">
		<ChefkochImportButton loading={importLoading} onClick={importFromChefkoch} />
		<Button title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
