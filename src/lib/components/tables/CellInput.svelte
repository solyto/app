<script lang="ts">
	import type { Table, TableColumn } from '$lib/types/table';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getTables } from '$lib/state/Tables.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import DateInput from '$lib/components/forms/DateInput.svelte';
	import Checkbox from '$lib/components/forms/Checkbox.svelte';
	import Select from '$lib/components/forms/Select.svelte';

	let {
		table,
		column,
		value = $bindable()
	} = $props<{
		table: Table;
		column: TableColumn;
		value: string | number | boolean | string[] | null;
	}>();

	const ts = getTranslation();
	const tables = getTables();
	const auth = getAuth();

	let tagsInput = $state<string>(Array.isArray(value) ? (value as string[]).join(', ') : '');
	let uploading = $state<boolean>(false);

	let pictureUrl = $derived(
		column.type === 'picture' && value
			? `${API_USER_STORAGE_URL}/${auth.user?.id}/tables/${table.id}/${value}`
			: null
	);

	function onTagsInput(): void {
		value = tagsInput
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag.length > 0);
	}

	async function onFileSelected(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		const fileName = await tables.uploadImage(table, file);
		uploading = false;

		if (fileName) value = fileName;
	}
</script>

{#if column.type === 'text'}
	<TextInput bind:value onblur={() => {}} placeholder={column.name} />
{:else if column.type === 'url'}
	<TextInput bind:value onblur={() => {}} placeholder="https://" />
{:else if column.type === 'number'}
	<NumberInput bind:value onblur={() => {}} placeholder={column.name} />
{:else if column.type === 'date'}
	<DateInput bind:value onblur={() => {}} />
{:else if column.type === 'checkbox'}
	<Checkbox isChecked={!!value} onchange={() => (value = !value)} />
{:else if column.type === 'select'}
	<Select
		bind:value
		options={[
			{ label: ts.get.tables.not_set, value: '' },
			...(column.options ?? []).map((option: string) => ({ label: option, value: option }))
		]}
	/>
{:else if column.type === 'tags'}
	<TextInput
		bind:value={tagsInput}
		oninput={onTagsInput}
		onblur={() => {}}
		placeholder={ts.get.tables.tags_placeholder}
	/>
{:else if column.type === 'picture'}
	<div class="flex items-center gap-3">
		{#if pictureUrl}
			<img src={pictureUrl} alt={column.name} class="size-16 rounded-lg object-cover" />
		{/if}
		<label
			class="cursor-pointer rounded-lg border-1 border-c-neutral-2 px-3 py-2 text-sm shadow-xs transition-all hover:bg-c-neutral-1 dark:border-s-dark-3 dark:hover:bg-s-dark-3"
		>
			{uploading
				? ts.get.layout.processing
				: pictureUrl
					? ts.get.tables.change_image
					: ts.get.tables.upload_image}
			<input type="file" accept="image/*" class="hidden" onchange={onFileSelected} />
		</label>
	</div>
{/if}
