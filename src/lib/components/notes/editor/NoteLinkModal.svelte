<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import NoteLinkList from './NoteLinkList.svelte';
	import { NotePicker } from '$lib/helpers/NotePicker.svelte';
	import { getNotes, NotesSvelte } from '$lib/state/Notes.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import type { Note } from '$lib/types/note';

	let { onpick, onCancel }: {
		onpick: (note: Note) => void;
		onCancel: () => void;
	} = $props();

	const notes = getNotes();
	const ts = getTranslation();
	const picker = new NotePicker((term) => notes.searchLinkableNotes(term, NotesSvelte.LINK_PICKER_LIMIT));

	let input = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);

	picker.search('');

	onMount(() => input?.focus());

	function pickSelected(): void {
		const note = picker.selected();
		if (note) onpick(note);
	}
</script>

<ConfirmationModal title={ts.get.notes.link_to_note} onConfirm={pickSelected} {onCancel} width="w-112">
	<div class="flex flex-col gap-2">
		<TextInput
			bind:input
			bind:value={picker.term}
			placeholder={ts.get.notes.search_placeholder}
			oninput={() => picker.search()}
			autocomplete="off"
		/>
		<NoteLinkList {picker} {onpick} class="max-h-72 overflow-y-auto" />
	</div>
</ConfirmationModal>
