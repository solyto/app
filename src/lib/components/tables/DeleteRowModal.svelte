<script lang="ts">
	import type { Table, TableRow } from '$lib/types/table';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getTables } from '$lib/state/Tables.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';

	let { table, row, onClose } = $props<{
		table: Table;
		row: TableRow;
		onClose: () => void;
	}>();

	const ts = getTranslation();
	const tables = getTables();

	async function onConfirm(): Promise<void> {
		await tables.deleteRow(table, row);
		onClose();
	}
</script>

<ConfirmationModal
	title={ts.get.tables.delete_row_confirm_label}
	description={ts.get.tables.delete_row_confirm_message}
	type="confirm-delete"
	{onConfirm}
	onCancel={onClose}
/>
