<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import EditorPopover from './EditorPopover.svelte';
	import EditorPopoverDivider from './EditorPopoverDivider.svelte';
	import InsertLinkModal from './InsertLinkModal.svelte';
	import ArrowUpRight from '$lib/icons/lucide/arrow-up-right.svelte';
	import ExternalLink from '$lib/icons/lucide/external-link.svelte';
	import Pencil from '$lib/icons/lucide/pencil.svelte';
	import Unlink from '$lib/icons/lucide/unlink.svelte';
	import { getNotes } from '$lib/state/Notes.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { hostnameOf, safeHref } from '$lib/helpers/UrlHelper';

	export type ActiveLink = {
		href: string;
		text: string;
	};

	let {
		editor,
		link,
		iconSize,
		buttonClass,
		root = $bindable<HTMLDivElement | null>(null)
	}: {
		editor: Editor | null;
		link: ActiveLink | null;
		iconSize: number;
		buttonClass: string;
		root: HTMLDivElement | null;
	} = $props();

	const notes = getNotes();
	const ts = getTranslation();

	let editModalOpen = $state<boolean>(false);
	let editedLink = $state<ActiveLink | null>(null);

	function noteId(): string | null {
		return link ? notes.linkService.noteIdFromHref(link.href) : null;
	}

	function isMissingNote(): boolean {
		const id = noteId();
		return id !== null && notes.findNote(id) === null;
	}

	function label(): string {
		if (!link) return '';

		const id = noteId();
		if (id !== null) return notes.findNote(id)?.title ?? link.text;

		return hostnameOf(link.href) ?? link.href;
	}

	function externalHref(): string | undefined {
		return link ? safeHref(link.href) : undefined;
	}

	async function openNote(): Promise<void> {
		const id = noteId();
		if (id !== null) await notes.openNote(id);
	}

	function openEditModal(): void {
		editedLink = link;
		editModalOpen = true;
	}

	function confirmEdit(url: string, name: string): void {
		editor
			?.chain()
			.focus()
			.extendMarkRange('link')
			.insertContent({ type: 'text', text: name || url, marks: [{ type: 'link', attrs: { href: url } }] })
			.run();
		editModalOpen = false;
	}

	function removeLink(): void {
		editor?.chain().focus().extendMarkRange('link').unsetLink().run();
	}
</script>

<EditorPopover bind:root class="flex items-center gap-0.5 px-1.5 py-1">
	<span
		class="max-w-48 truncate px-1.5 text-xs text-c-neutral-5 dark:text-c-neutral-4"
		class:italic={isMissingNote()}
	>
		{label()}
	</span>

	<EditorPopoverDivider />

	{#if noteId() !== null}
		<button onclick={openNote} class="toolbar-btn {buttonClass}" title={ts.get.notes.link_open}>
			<ArrowUpRight size={iconSize} />
		</button>
	{:else if externalHref()}
		<a href={externalHref()} target="_blank" rel="external" class="toolbar-btn {buttonClass}" title={ts.get.notes.link_open}>
			<ExternalLink size={iconSize} />
		</a>
	{/if}
	<button onclick={openEditModal} class="toolbar-btn {buttonClass}" title={ts.get.notes.link_edit}>
		<Pencil size={iconSize} />
	</button>
	<button onclick={removeLink} class="toolbar-btn {buttonClass}" title={ts.get.notes.link_remove}>
		<Unlink size={iconSize} />
	</button>
</EditorPopover>

{#if editModalOpen && editedLink}
	<InsertLinkModal
		onConfirm={confirmEdit}
		onCancel={() => (editModalOpen = false)}
		initialUrl={editedLink.href}
		initialName={editedLink.text}
	/>
{/if}
