<script lang="ts">
	import type { Table, TableColumn } from '$lib/types/table';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getTables } from '$lib/state/Tables.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';

	let { table, column, onClose } = $props<{
		table: Table;
		column: TableColumn;
		onClose: () => void;
	}>();

	const ts = getTranslation();
	const tables = getTables();

	async function onConfirm(): Promise<void> {
		await tables.deleteColumn(table, column);
		onClose();
	}
</script>

<ConfirmationModal
	title={ts.get.tables.delete_column_confirm_label}
	description={ts.get.tables.delete_column_confirm_message}
	type="confirm-delete"
	{onConfirm}
	onCancel={onClose}
/>
