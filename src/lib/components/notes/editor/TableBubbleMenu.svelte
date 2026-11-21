<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import TableRowInsertBefore from '$lib/icons/lucide/panel-top-dashed.svelte';
	import TableRowInsertAfter from '$lib/icons/lucide/panel-bottom-dashed.svelte';
	import TableColInsertBefore from '$lib/icons/lucide/panel-left-dashed.svelte';
	import TableColInsertAfter from '$lib/icons/lucide/panel-right-dashed.svelte';
	import TableIcon from '$lib/icons/lucide/table.svelte';
	import Trash from '$lib/icons/lucide/trash.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';

	const ts = getTranslation();

	let {
		editor,
		root = $bindable<HTMLDivElement | null>(null)
	}: { editor: Editor | null; root: HTMLDivElement | null } = $props();
</script>

<div bind:this={root} style="position:fixed;top:-9999px;left:-9999px">
	<div
		class="flex items-center gap-0.5 rounded-lg border border-c-neutral-2 bg-c-bg-modal px-1.5 py-1 shadow-md dark:border-s-dark"
	>
		<button
			onclick={() => editor?.chain().focus().addRowBefore().run()}
			class="toolbar-btn"
			title={ts.get.notes.table_add_row_above}
		>
			<TableRowInsertBefore size={14} />
		</button>
		<button
			onclick={() => editor?.chain().focus().addRowAfter().run()}
			class="toolbar-btn"
			title={ts.get.notes.table_add_row_below}
		>
			<TableRowInsertAfter size={14} />
		</button>
		<button
			onclick={() => editor?.chain().focus().deleteRow().run()}
			class="toolbar-btn text-s-delete hover:bg-red-50 dark:hover:bg-red-950/30"
			title={ts.get.notes.table_delete_row}
		>
			<Trash size={14} />
		</button>

		<div class="toolbar-divider"></div>

		<button
			onclick={() => editor?.chain().focus().addColumnBefore().run()}
			class="toolbar-btn"
			title={ts.get.notes.table_add_column_left}
		>
			<TableColInsertBefore size={14} />
		</button>
		<button
			onclick={() => editor?.chain().focus().addColumnAfter().run()}
			class="toolbar-btn"
			title={ts.get.notes.table_add_column_right}
		>
			<TableColInsertAfter size={14} />
		</button>
		<button
			onclick={() => editor?.chain().focus().deleteColumn().run()}
			class="toolbar-btn text-s-delete hover:bg-red-50 dark:hover:bg-red-950/30"
			title={ts.get.notes.table_delete_column}
		>
			<Trash size={14} />
		</button>

		<div class="toolbar-divider"></div>

		<button
			onclick={() => editor?.chain().focus().deleteTable().run()}
			class="toolbar-btn text-s-delete hover:bg-red-50 dark:hover:bg-red-950/30"
			title={ts.get.notes.table_delete}
		>
			<TableIcon size={14} />
		</button>
	</div>
</div>
