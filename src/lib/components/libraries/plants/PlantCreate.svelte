<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import DateInput from '$lib/components/forms/DateInput.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { getAuth } from '$lib/state/Auth.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import Checkbox from '$lib/components/forms/Checkbox.svelte';
	import type { CreatePlantRequest, Plant, UpdatePlantRequest } from '$lib/types/library_plant';
	import CreateModal from '$lib/components/libraries/shared/CreateModal.svelte';
	import { getPlantLibrary } from '$lib/state/PlantLibrary.svelte';

	const ts = getTranslation();
	const library = getPlantLibrary();
	const auth = getAuth();
	const loadingIndicator = getLoadingIndicator();

	let activeEntry = $state<Plant | null>(library.activeEntry);

	let nameValue = $state<string>(activeEntry ? activeEntry.name : '');
	let latinNameValue = $state<string>(activeEntry?.latin_name ?? '');
	let locationValue = $state<string>(activeEntry?.location ?? '');
	let sunlightValue = $state<string>(activeEntry?.sunlight ?? '');
	let currentSizeValue = $state<string>(activeEntry?.current_size ?? '');
	let maxSizeValue = $state<string>(activeEntry?.max_size ?? '');
	let acquiredAtValue = $state<string>(activeEntry?.acquired_at?.substring(0, 10) ?? '');
	let winterHardyValue = $state<boolean>(activeEntry?.winter_hardy ?? false);
	let instructionsValue = $state<string>(activeEntry?.instructions ?? '');
	let coverValue = $state<string>('');
	let linkValue = $state<string>(activeEntry?.link ?? '');
	let isWishlist = $state<boolean>(activeEntry ? activeEntry.wishlist : false);

	const locationOptions: { label: string; value: string }[] = [
		{ label: ts.get.libraries.plants.location_indoor, value: 'indoor' },
		{ label: ts.get.libraries.plants.location_outdoor, value: 'outdoor' },
		{ label: ts.get.libraries.plants.location_both, value: 'both' }
	];

	const sunlightOptions: { label: string; value: string }[] = [
		{ label: ts.get.libraries.plants.sunlight_full_sun, value: 'full_sun' },
		{ label: ts.get.libraries.plants.sunlight_partial_sun, value: 'partial_sun' },
		{ label: ts.get.libraries.plants.sunlight_indirect, value: 'indirect' },
		{ label: ts.get.libraries.plants.sunlight_shade, value: 'shade' }
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

		const request: CreatePlantRequest = {
			name: nameValue,
			latin_name: latinNameValue !== '' ? latinNameValue : null,
			location: locationValue !== '' ? (locationValue as any) : null,
			sunlight: sunlightValue !== '' ? (sunlightValue as any) : null,
			current_size: currentSizeValue !== '' ? currentSizeValue : null,
			max_size: maxSizeValue !== '' ? maxSizeValue : null,
			acquired_at: acquiredAtValue !== '' ? acquiredAtValue : null,
			winter_hardy: locationValue === 'outdoor' || locationValue === 'both' ? winterHardyValue : null,
			instructions: instructionsValue !== '' ? instructionsValue : null,
			wishlist: isWishlist,
			cover_path: coverValue !== '' ? coverValue : null,
			link: linkValue !== '' ? linkValue : null
		};

		const ok = await library.create(request);
		if (ok) library.closeCreateModal();

		loadingIndicator.stop();
	}

	async function update(): Promise<void> {
		loadingIndicator.start();

		const request: UpdatePlantRequest = {
			name: nameValue,
			latin_name: latinNameValue !== '' ? latinNameValue : null,
			location: locationValue !== '' ? (locationValue as any) : null,
			sunlight: sunlightValue !== '' ? (sunlightValue as any) : null,
			current_size: currentSizeValue !== '' ? currentSizeValue : null,
			max_size: maxSizeValue !== '' ? maxSizeValue : null,
			acquired_at: acquiredAtValue !== '' ? acquiredAtValue : null,
			winter_hardy: locationValue === 'outdoor' || locationValue === 'both' ? winterHardyValue : null,
			instructions: instructionsValue !== '' ? instructionsValue : null,
			wishlist: isWishlist,
			...(coverValue !== '' ? { cover_path: coverValue } : {}),
			link: linkValue !== '' ? linkValue : null
		};

		const ok = await library.update(activeEntry!, request);
		if (ok) library.closeCreateModal();

		loadingIndicator.stop();
	}
</script>

<CreateModal
	title={activeEntry !== null
		? ts.get.libraries.plants.edit_plant
		: ts.get.libraries.plants.add_plant}
	{library}
	existingCover={activeEntry
		? `${API_USER_STORAGE_URL}/${auth?.user.id}/${library.config.type}/${activeEntry.cover}`
		: null}
	newCover={coverValue}
	bind:isWishlist
>
	<ModalFormRow label={ts.get.libraries.plants.name}>
		<TextInput bind:value={nameValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.plants.latin_name}>
		<TextInput bind:value={latinNameValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.plants.location}>
		<Select bind:value={locationValue} options={locationOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.plants.sunlight}>
		<Select bind:value={sunlightValue} options={sunlightOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.plants.current_size}>
		<TextInput bind:value={currentSizeValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.plants.max_size}>
		<TextInput bind:value={maxSizeValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.plants.acquired_at}>
		<DateInput bind:value={acquiredAtValue} />
	</ModalFormRow>
	{#if locationValue === 'outdoor' || locationValue === 'both'}
		<ModalFormRow label={ts.get.libraries.plants.winter_hardy}>
			<Checkbox bind:checked={winterHardyValue} />
		</ModalFormRow>
	{/if}
	<ModalFormRow label={ts.get.libraries.plants.instructions}>
		<TextInput bind:value={instructionsValue} multiLine={true} height={120} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.plants.cover}>
		<TextInput bind:value={coverValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.plants.link}>
		<TextInput bind:value={linkValue} />
	</ModalFormRow>
	<div class="mt-8 flex w-full flex-row items-center justify-end gap-6">
		<Button title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
