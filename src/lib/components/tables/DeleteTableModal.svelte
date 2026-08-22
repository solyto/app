<script lang="ts">
	import type { Table } from '$lib/types/table';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getTables } from '$lib/state/Tables.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';

	let { table, onClose } = $props<{
		table: Table;
		onClose: () => void;
	}>();

	const ts = getTranslation();
	const tables = getTables();

	async function onConfirm(): Promise<void> {
		await tables.delete(table);
		onClose();
	}
</script>

<ConfirmationModal
	title={ts.get.tables.delete_table_confirm_label}
	description={ts.get.tables.delete_table_confirm_message}
	type="confirm-delete"
	{onConfirm}
	onCancel={onClose}
/>
