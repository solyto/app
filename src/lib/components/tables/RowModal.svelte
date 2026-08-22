<script lang="ts">
	import type { Table, TableRow, TableRowData } from '$lib/types/table';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getTables } from '$lib/state/Tables.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import CellInput from '$lib/components/tables/CellInput.svelte';

	let { table, row, onClose } = $props<{
		table: Table;
		row: TableRow | null;
		onClose: () => void;
	}>();

	const ts = getTranslation();
	const tables = getTables();

	let data = $state<TableRowData>({ ...(row?.data ?? {}) });

	async function onConfirm(): Promise<void> {
		if (row) {
			await tables.updateRow(table, row, { data });
		} else {
			await tables.createRow(table, { data });
		}
		onClose();
	}
</script>

<ConfirmationModal
	title={row ? ts.get.tables.edit_row : ts.get.tables.add_row}
	{onConfirm}
	onCancel={onClose}
>
	<div class="flex w-full flex-col gap-3">
		{#each table.columns ?? [] as column (column.id)}
			<ModalFormRow label={column.name}>
				<CellInput {table} {column} bind:value={data[column.id]} />
			</ModalFormRow>
		{/each}
	</div>
</ConfirmationModal>
