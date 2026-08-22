<script lang="ts">
	import type { Table, TableColumn } from '$lib/types/table';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { formatDate } from '$lib/helpers/DateHelper';
	import IconCheck from '@lucide/svelte/icons/check';
	import IconX from '@lucide/svelte/icons/x';
	import IconExternalLink from '@lucide/svelte/icons/external-link';

	let { table, column, value } = $props<{
		table: Table;
		column: TableColumn;
		value: string | number | boolean | string[] | null;
	}>();

	const ts = getTranslation();
	const auth = getAuth();

	let pictureUrl = $derived(
		column.type === 'picture' && value
			? `${API_USER_STORAGE_URL}/${auth.user?.id}/tables/${table.id}/${value}`
			: null
	);
</script>

{#if column.type === 'picture'}
	{#if pictureUrl}
		<img src={pictureUrl} alt={column.name} class="size-16 rounded-lg object-cover" />
	{:else}
		<div
			class="flex size-16 items-center justify-center rounded-lg bg-c-neutral-1 text-xs text-c-neutral-5 dark:bg-s-dark-3"
		>
			{ts.get.tables.not_set}
		</div>
	{/if}
{:else if column.type === 'checkbox'}
	{#if value}
		<IconCheck class="size-4 text-c-success" />
	{:else}
		<IconX class="size-4 text-c-neutral-4" />
	{/if}
{:else if column.type === 'url'}
	{#if value}
		<a
			href={value}
			target="_blank"
			rel="external noopener noreferrer"
			class="inline-flex items-center gap-1 text-d-lightblue hover:underline dark:text-c-primary"
			onclick={(e) => e.stopPropagation()}
		>
			<span class="max-w-48 truncate">{value}</span>
			<IconExternalLink class="size-3 shrink-0" />
		</a>
	{:else}
		<span class="text-c-neutral-4">{ts.get.tables.not_set}</span>
	{/if}
{:else if column.type === 'tags'}
	{#if Array.isArray(value) && value.length > 0}
		<div class="flex flex-wrap gap-1">
			{#each value as tag (tag)}
				<span
					class="rounded-full bg-c-neutral-1 px-2 py-0.5 text-xs text-c-neutral-7 dark:bg-s-dark-3 dark:text-c-neutral-2"
				>
					{tag}
				</span>
			{/each}
		</div>
	{:else}
		<span class="text-c-neutral-4">{ts.get.tables.not_set}</span>
	{/if}
{:else if column.type === 'date'}
	{#if value}
		<span>{formatDate(value as string, auth.user?.settings?.date_format ?? null)}</span>
	{:else}
		<span class="text-c-neutral-4">{ts.get.tables.not_set}</span>
	{/if}
{:else if value !== null && value !== undefined && value !== ''}
	<span>{value}</span>
{:else}
	<span class="text-c-neutral-4">{ts.get.tables.not_set}</span>
{/if}
