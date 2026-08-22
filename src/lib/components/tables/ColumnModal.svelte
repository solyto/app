<script lang="ts">
	import type { Table, TableColumn, TableColumnType } from '$lib/types/table';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getTables } from '$lib/state/Tables.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import IconX from '@lucide/svelte/icons/x';

	let { table, column, onClose } = $props<{
		table: Table;
		column: TableColumn | null;
		onClose: () => void;
	}>();

	const ts = getTranslation();
	const tables = getTables();

	let name = $state<string>(column?.name ?? '');
	let type = $state<TableColumnType>(column?.type ?? 'text');
	let options = $state<string[]>(column?.options ? [...column.options] : []);

	let typeOptions = $derived(
		[
			['text', ts.get.tables.column_type_text],
			['number', ts.get.tables.column_type_number],
			['date', ts.get.tables.column_type_date],
			['checkbox', ts.get.tables.column_type_checkbox],
			['url', ts.get.tables.column_type_url],
			['select', ts.get.tables.column_type_select],
			['tags', ts.get.tables.column_type_tags],
			['picture', ts.get.tables.column_type_picture]
		].map(([value, label]) => ({ value, label }))
	);

	function addOption(): void {
		options = [...options, ''];
	}

	function removeOption(index: number): void {
		options = options.filter((_, i) => i !== index);
	}

	async function onConfirm(): Promise<void> {
		const request = {
			name,
			type,
			options:
				type === 'select' ? options.map((o) => o.trim()).filter((o) => o.length > 0) : null
		};

		if (column) {
			await tables.updateColumn(table, column, request);
		} else {
			await tables.createColumn(table, request);
		}
		onClose();
	}
</script>

<ConfirmationModal
	title={column ? ts.get.tables.edit_column : ts.get.tables.add_column}
	{onConfirm}
	onCancel={onClose}
>
	<div class="flex w-full flex-col gap-3">
		<ModalFormRow label={ts.get.tables.column_name}>
			<TextInput
				bind:value={name}
				onblur={() => {}}
				placeholder={ts.get.tables.column_name_placeholder}
			/>
		</ModalFormRow>
		<ModalFormRow label={ts.get.tables.column_type}>
			<Select bind:value={type} options={typeOptions} />
		</ModalFormRow>
		{#if type === 'select'}
			<ModalFormRow label={ts.get.tables.select_options}>
				<div class="flex w-full flex-col gap-2">
					{#each options.map((_, i) => i) as index (index)}
						<div class="flex items-center gap-2">
							<TextInput
								bind:value={options[index]}
								onblur={() => {}}
								placeholder={ts.get.tables.select_option_placeholder}
							/>
							<button
								type="button"
								class="cursor-pointer text-c-neutral-4 hover:text-c-danger"
								onclick={() => removeOption(index)}
							>
								<IconX class="size-4" />
							</button>
						</div>
					{/each}
					<button
						type="button"
						class="w-fit cursor-pointer text-sm text-d-lightblue hover:underline dark:text-c-primary"
						onclick={addOption}
					>
						+ {ts.get.tables.add_option}
					</button>
				</div>
			</ModalFormRow>
		{/if}
	</div>
</ConfirmationModal>
