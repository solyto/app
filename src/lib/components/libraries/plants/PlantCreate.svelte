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
	let coverValue = $state<string>(activeEntry?.cover?.startsWith('http') ? activeEntry.cover : '');
	let coverFile = $state<File | null>(null);
	let coverPreviewUrl = $state<string | null>(null);
	let coverRemoved = $state<boolean>(false);
	let linkValue = $state<string>(activeEntry?.link ?? '');

	let fileInput = $state<HTMLInputElement | null>(null);

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

	function onCoverUrlInput(): void {
		if (coverValue !== '') {
			coverFile = null;
			coverRemoved = false;
			if (coverPreviewUrl) {
				URL.revokeObjectURL(coverPreviewUrl);
				coverPreviewUrl = null;
			}
			if (fileInput) fileInput.value = '';
		}
	}

	function onCoverRemove(): void {
		coverValue = '';
		coverFile = null;
		coverRemoved = true;
		if (coverPreviewUrl) {
			URL.revokeObjectURL(coverPreviewUrl);
			coverPreviewUrl = null;
		}
		if (fileInput) fileInput.value = '';
	}

	async function onFileSelected(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		coverValue = '';

		const resized = await resizeImage(file);
		coverFile = resized;

		if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
		coverPreviewUrl = URL.createObjectURL(resized);
	}

	async function resizeImage(file: File, maxDimension = 800): Promise<File> {
		return new Promise((resolve) => {
			const img = new Image();
			const url = URL.createObjectURL(file);
			img.onload = () => {
				URL.revokeObjectURL(url);
				const canvas = document.createElement('canvas');
				let { width, height } = img;
				if (width > maxDimension || height > maxDimension) {
					if (width > height) {
						height = Math.round((height * maxDimension) / width);
						width = maxDimension;
					} else {
						width = Math.round((width * maxDimension) / height);
						height = maxDimension;
					}
				}
				canvas.width = width;
				canvas.height = height;
				canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
				canvas.toBlob(
					(blob) => resolve(new File([blob!], file.name, { type: file.type })),
					file.type,
					0.85
				);
			};
			img.src = url;
		});
	}

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
			cover_path: coverFile === null && coverValue !== '' ? coverValue : null,
			link: linkValue !== '' ? linkValue : null
		};

		const ok = await library.create(request, coverFile ?? undefined);
		if (ok) library.closeCreateModal();

		loadingIndicator.stop();
	}

	function getCoverUpdate(): { cover_path: string | null } | {} {
		if (coverRemoved) return { cover_path: null };
		if (coverFile === null && coverValue !== '') return { cover_path: coverValue };
		return {};
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
			...getCoverUpdate(),
			link: linkValue !== '' ? linkValue : null
		};

		const ok = await library.update(activeEntry!, request);

		if (ok && coverFile) {
			await library.uploadCover(activeEntry!.id, coverFile);
		}

		if (ok) library.closeCreateModal();

		loadingIndicator.stop();
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept="image/jpeg,image/png,image/gif,image/webp"
	class="hidden"
	onchange={onFileSelected}
/>

<CreateModal
	title={activeEntry !== null
		? ts.get.libraries.plants.edit_plant
		: ts.get.libraries.plants.add_plant}
	{library}
	existingCover={activeEntry && activeEntry.cover && !coverFile && !coverValue && !coverRemoved
		? `${API_USER_STORAGE_URL}/${auth?.user.id}/${library.config.type}/${activeEntry.cover}`
		: null}
	newCover={coverPreviewUrl ?? (coverValue || undefined)}
	onCoverClick={() => fileInput?.click()}
	onCoverRemove={onCoverRemove}
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
			<Checkbox isChecked={winterHardyValue} onchange={() => (winterHardyValue = !winterHardyValue)} class="pt-[9px]" />
		</ModalFormRow>
	{/if}
	<ModalFormRow label={ts.get.libraries.plants.instructions}>
		<TextInput bind:value={instructionsValue} multiLine={true} height={120} />
	</ModalFormRow>
	{#if !coverFile}
		<ModalFormRow label={ts.get.libraries.plants.cover}>
			<TextInput bind:value={coverValue} oninput={onCoverUrlInput} placeholder="https://" />
		</ModalFormRow>
	{/if}
	<ModalFormRow label={ts.get.libraries.plants.link}>
		<TextInput bind:value={linkValue} placeholder="https://" />
	</ModalFormRow>
	<div class="mt-8 flex w-full flex-row items-center justify-end gap-6">
		<Button title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
