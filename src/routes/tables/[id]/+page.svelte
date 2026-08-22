<script lang="ts">
	import { getTables } from '$lib/state/Tables.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { page } from '$app/state';
	import ViewSwitcher from '$lib/components/ui/ViewSwitcher.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import InlineEditButton from '$lib/components/ui/buttons/InlineEditButton.svelte';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';
	import TableModal from '$lib/components/tables/TableModal.svelte';
	import DeleteTableModal from '$lib/components/tables/DeleteTableModal.svelte';
	import ColumnModal from '$lib/components/tables/ColumnModal.svelte';
	import DeleteColumnModal from '$lib/components/tables/DeleteColumnModal.svelte';
	import RowModal from '$lib/components/tables/RowModal.svelte';
	import DeleteRowModal from '$lib/components/tables/DeleteRowModal.svelte';
	import RowListItem from '$lib/components/tables/RowListItem.svelte';
	import RowCard from '$lib/components/tables/RowCard.svelte';
	import type { TableColumn, TableRow, TableView } from '$lib/types/table';
	import IconPen from '@lucide/svelte/icons/pen';
	import IconX from '@lucide/svelte/icons/x';

	const tables = getTables();
	const ts = getTranslation();

	let editTableModalOpen = $state<boolean>(false);
	let deleteTableModalOpen = $state<boolean>(false);
	let columnModalOpen = $state<boolean>(false);
	let editingColumn = $state<TableColumn | null>(null);
	let deletingColumn = $state<TableColumn | null>(null);
	let rowModalOpen = $state<boolean>(false);
	let editingRow = $state<TableRow | null>(null);
	let deletingRow = $state<TableRow | null>(null);

	$effect(() => {
		const id = page.params.id;
		if (id) void tables.loadTable(id);
	});

	function openAddColumn(): void {
		editingColumn = null;
		columnModalOpen = true;
	}

	function openEditColumn(column: TableColumn): void {
		editingColumn = column;
		columnModalOpen = true;
	}

	function openAddRow(): void {
		editingRow = null;
		rowModalOpen = true;
	}

	function openEditRow(row: TableRow): void {
		editingRow = row;
		rowModalOpen = true;
	}

	async function onChangeView(view: string): Promise<void> {
		if (!tables.activeTable) return;
		await tables.update(tables.activeTable, { view: view as TableView });
	}
</script>

<div class="flex h-full w-full flex-col gap-4 p-4 lg:px-8">
	{#if tables.activeTableLoaded && tables.activeTable}
		{@const table = tables.activeTable}
		<div class="flex w-full flex-wrap items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-bold text-c-heading dark:text-c-primary">{table.name}</h1>
				<InlineEditButton
					onClick={() => {
						editTableModalOpen = true;
					}}
				/>
				<InlineDeleteButton
					onClick={() => {
						deleteTableModalOpen = true;
					}}
				/>
			</div>
			<div class="flex items-center gap-2">
				<ViewSwitcher
					views={[
						{ type: 'list', title: ts.get.tables.list_view },
						{ type: 'card', title: ts.get.tables.card_view }
					]}
					currentlySelected={table.view}
					onChange={onChangeView}
				/>
				<TextButton
					title={ts.get.tables.add_row}
					onclick={openAddRow}
					disabled={(table.columns ?? []).length === 0}
				/>
			</div>
		</div>

		<div class="flex w-full flex-wrap items-center gap-2">
			{#each table.columns ?? [] as column (column.id)}
				<div
					class="group flex items-center gap-1 rounded-full bg-c-neutral-1 py-1 pr-1 pl-3 text-xs text-c-neutral-7 dark:bg-s-dark-3 dark:text-c-neutral-2"
				>
					<span>{column.name}</span>
					<button
						type="button"
						class="cursor-pointer rounded-full p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-c-neutral-2 dark:hover:bg-s-dark-2"
						onclick={() => openEditColumn(column)}
						title={ts.get.tables.edit_column}
					>
						<IconPen class="size-3" />
					</button>
					<button
						type="button"
						class="cursor-pointer rounded-full p-1 text-c-danger opacity-0 transition-all group-hover:opacity-100 hover:bg-c-neutral-2 dark:hover:bg-s-dark-2"
						onclick={() => (deletingColumn = column)}
						title={ts.get.tables.delete_column}
					>
						<IconX class="size-3" />
					</button>
				</div>
			{/each}
			<TextButton title={ts.get.tables.add_column} type="slight" onclick={openAddColumn} />
		</div>

		{#if (table.columns ?? []).length === 0}
			<div
				class="flex h-full w-full flex-col items-center justify-center gap-2 px-8 text-center"
			>
				<h2 class="text-xl font-bold text-c-heading dark:text-c-primary">
					{ts.get.tables.no_columns}
				</h2>
				<p class="text-c-neutral-5">{ts.get.tables.no_columns_instruction}</p>
			</div>
		{:else if (table.rows ?? []).length === 0}
			<p class="text-c-neutral-5">{ts.get.tables.no_rows}</p>
		{:else if table.view === 'card'}
			<div class="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each table.rows ?? [] as row (row.id)}
					<RowCard
						{table}
						{row}
						onEdit={() => openEditRow(row)}
						onDelete={() => (deletingRow = row)}
					/>
				{/each}
			</div>
		{:else}
			<div class="flex w-full flex-col gap-2">
				{#each table.rows ?? [] as row (row.id)}
					<RowListItem
						{table}
						{row}
						onEdit={() => openEditRow(row)}
						onDelete={() => (deletingRow = row)}
					/>
				{/each}
			</div>
		{/if}

		{#if editTableModalOpen}
			<TableModal {table} onClose={() => (editTableModalOpen = false)} />
		{/if}
		{#if deleteTableModalOpen}
			<DeleteTableModal {table} onClose={() => (deleteTableModalOpen = false)} />
		{/if}
		{#if columnModalOpen}
			<ColumnModal {table} column={editingColumn} onClose={() => (columnModalOpen = false)} />
		{/if}
		{#if deletingColumn}
			<DeleteColumnModal
				{table}
				column={deletingColumn}
				onClose={() => (deletingColumn = null)}
			/>
		{/if}
		{#if rowModalOpen}
			<RowModal {table} row={editingRow} onClose={() => (rowModalOpen = false)} />
		{/if}
		{#if deletingRow}
			<DeleteRowModal {table} row={deletingRow} onClose={() => (deletingRow = null)} />
		{/if}
	{/if}
</div>
