<script lang="ts">
	import type { Table, TableColumn, TableRow } from '$lib/types/table';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import CellValue from '$lib/components/tables/CellValue.svelte';
	import InlineEditButton from '$lib/components/ui/buttons/InlineEditButton.svelte';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';

	let { table, row, onEdit, onDelete } = $props<{
		table: Table;
		row: TableRow;
		onEdit: () => void;
		onDelete: () => void;
	}>();

	const auth = getAuth();

	let pictureColumn = $derived(
		(table.columns ?? []).find((c: TableColumn) => c.type === 'picture')
	);
	let pictureValue = $derived(pictureColumn ? row.data[pictureColumn.id] : null);
	let pictureUrl = $derived(
		pictureValue
			? `${API_USER_STORAGE_URL}/${auth.user?.id}/tables/${table.id}/${pictureValue}`
			: null
	);
	let otherColumns = $derived(
		(table.columns ?? []).filter((c: TableColumn) => c.id !== pictureColumn?.id)
	);
</script>

<div
	class="group relative flex h-full w-full flex-col gap-3 rounded-md p-4 shadow-sm transition-all hover:bg-c-neutral dark:shadow-s-dark-shadow dark:hover:bg-s-dark-3 dark:md:bg-s-dark-2"
>
	<div class="absolute top-2 right-2 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
		<InlineEditButton onClick={onEdit} />
		<InlineDeleteButton onClick={onDelete} />
	</div>
	{#if pictureUrl}
		<img src={pictureUrl} alt="" class="h-32 w-full rounded-lg object-cover" />
	{/if}
	<div class="flex flex-col gap-2">
		{#each otherColumns as column (column.id)}
			<div class="flex flex-col gap-1">
				<span class="text-xs text-c-neutral-5">{column.name}</span>
				<CellValue {table} {column} value={row.data[column.id] ?? null} />
			</div>
		{/each}
	</div>
</div>
