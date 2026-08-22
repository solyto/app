<script lang="ts">
	import type { Table, TableRow } from '$lib/types/table';
	import CellValue from '$lib/components/tables/CellValue.svelte';
	import InlineEditButton from '$lib/components/ui/buttons/InlineEditButton.svelte';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';

	let { table, row, onEdit, onDelete } = $props<{
		table: Table;
		row: TableRow;
		onEdit: () => void;
		onDelete: () => void;
	}>();
</script>

<div
	class="group flex w-full flex-wrap items-center gap-4 rounded-md p-3 shadow-sm transition-all hover:bg-c-neutral dark:shadow-s-dark-shadow dark:hover:bg-s-dark-3 dark:md:bg-s-dark-2"
>
	{#each table.columns ?? [] as column (column.id)}
		<div class="flex min-w-32 flex-1 flex-col gap-1">
			<span class="text-xs text-c-neutral-5">{column.name}</span>
			<CellValue {table} {column} value={row.data[column.id] ?? null} />
		</div>
	{/each}
	<div class="ml-auto flex shrink-0 gap-1 opacity-0 transition-all group-hover:opacity-100">
		<InlineEditButton onClick={onEdit} />
		<InlineDeleteButton onClick={onDelete} />
	</div>
</div>
