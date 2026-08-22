<script lang="ts">
	import { getTables } from '$lib/state/Tables.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import TableCard from '$lib/components/tables/TableCard.svelte';
	import TableModal from '$lib/components/tables/TableModal.svelte';
	import DeleteTableModal from '$lib/components/tables/DeleteTableModal.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import type { Table } from '$lib/types/table';

	const tables = getTables();
	const ts = getTranslation();

	let editModalOpen = $state<boolean>(false);
	let editingTable = $state<Table | null>(null);
	let deletingTable = $state<Table | null>(null);

	function openCreateModal(): void {
		editingTable = null;
		editModalOpen = true;
	}

	function openEditModal(table: Table): void {
		editingTable = table;
		editModalOpen = true;
	}
</script>

<div class="flex h-full w-full flex-col gap-4 px-4 max-md:mt-16 md:px-8">
	<div class="flex w-full items-center justify-between">
		<h1 class="text-2xl font-bold text-c-heading dark:text-c-primary">{ts.get.nav.tables}</h1>
		<TextButton title={ts.get.tables.new_table} onclick={openCreateModal} />
	</div>

	{#if tables.loaded}
		{#if tables.tables.length === 0}
			<div
				class="flex h-full w-full flex-col items-center justify-center gap-2 px-8 text-center"
			>
				<h2 class="text-xl font-bold text-c-heading dark:text-c-primary">
					{ts.get.tables.welcome}
				</h2>
				<p class="text-c-neutral-5">{ts.get.tables.instruction}</p>
			</div>
		{:else}
			<div class="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each tables.tables as table (table.id)}
					<TableCard
						{table}
						onEdit={() => openEditModal(table)}
						onDelete={() => (deletingTable = table)}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>

{#if editModalOpen}
	<TableModal table={editingTable} onClose={() => (editModalOpen = false)} />
{/if}

{#if deletingTable}
	<DeleteTableModal
		table={deletingTable}
		onDeleted={() => (deletingTable = null)}
		onCancel={() => (deletingTable = null)}
	/>
{/if}
