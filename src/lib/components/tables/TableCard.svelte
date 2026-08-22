<script lang="ts">
	import type { Table } from '$lib/types/table';
	import { urls } from '$lib/config/urls';
	import { resolve } from '$app/paths';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import IconTable from '@lucide/svelte/icons/table';
	import InlineEditButton from '$lib/components/ui/buttons/InlineEditButton.svelte';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';

	let { table, onEdit, onDelete } = $props<{
		table: Table;
		onEdit: () => void;
		onDelete: () => void;
	}>();

	const ts = getTranslation();
</script>

<div
	class="group relative flex h-full w-full flex-col gap-2 rounded-md p-4 shadow-sm transition-all hover:bg-c-neutral dark:shadow-s-dark-shadow dark:hover:bg-s-dark-3 dark:md:bg-s-dark-2"
>
	<div class="absolute top-2 right-2 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
		<InlineEditButton onClick={onEdit} />
		<InlineDeleteButton onClick={onDelete} />
	</div>
	<a href={resolve(urls.table, { id: table.id })} class="flex flex-col items-start gap-2 pr-14">
		<IconTable class="size-6 text-c-heading dark:text-c-primary" />
		<span class="text-lg font-bold text-c-heading dark:text-c-primary">{table.name}</span>
		<span class="text-sm text-c-neutral-5">
			{ts.get.tables.entries_count.replace('%s', String(table.rows_count ?? 0))}
		</span>
	</a>
</div>
