<script lang="ts">
	import type { Table } from '$lib/types/table';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getTables } from '$lib/state/Tables.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';

	let { table, onClose } = $props<{
		table: Table | null;
		onClose: (created: Table | null) => void;
	}>();

	const ts = getTranslation();
	const tables = getTables();

	let name = $state<string>(table?.name ?? '');

	async function onConfirm(): Promise<void> {
		if (!name.trim()) return;

		if (table) {
			await tables.update(table, { name });
			onClose(table);
		} else {
			const created = await tables.create({ name });
			onClose(created);
		}
	}
</script>

<ConfirmationModal
	title={table ? ts.get.tables.edit_table : ts.get.tables.new_table}
	{onConfirm}
	onCancel={() => onClose(null)}
>
	<TextInput
		bind:value={name}
		onblur={() => {}}
		placeholder={ts.get.tables.table_name_placeholder}
	/>
</ConfirmationModal>
