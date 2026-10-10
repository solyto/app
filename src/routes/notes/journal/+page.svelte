<script lang="ts">
	import { getNotes } from '$lib/state/Notes.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import JournalHeader from '$lib/components/notes/journal/JournalHeader.svelte';
	import JournalArchivePicker from '$lib/components/notes/journal/JournalArchivePicker.svelte';
	import TipTapEditor from '$lib/components/notes/editor/TipTapEditor.svelte';
	import { getDateMinusDays, isDateToday, isDateYesterday } from '$lib/helpers/DateHelper';
	import IconBookOpen from '@lucide/svelte/icons/book-open';

	const notes = getNotes();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();

	let selectedDate = $state<Date>(new Date());
	let archiveOpen = $state<boolean>(false);
	let initialised = $state<boolean>(false);

	let markedDates = $derived(notes.getJournalEntryDates());
	let isToday = $derived(isDateToday(selectedDate));
	let isYesterday = $derived(isDateYesterday(selectedDate));

	async function openDay(date: Date): Promise<void> {
		selectedDate = date;
		archiveOpen = false;
		loadingIndicator.start();
		await notes.openJournalEntry(date);
		loadingIndicator.stop();
	}

	$effect(() => {
		// Wait for both the notes and the categories to load before resolving the
		// day, so the journal folder is known and no stale note is shown.
		if (initialised || !notes.loaded || notes.journalCategory === null) return;
		initialised = true;
		openDay(new Date());
	});
</script>

<div class="relative flex h-full w-full flex-col gap-4 p-4 lg:px-8">
	<div class="flex flex-wrap items-center gap-2">
		<div class="mr-2 flex items-center gap-2">
			<IconBookOpen size={20} class="text-c-primary" />
			<h1 class="text-2xl font-bold">{ts.get.notes.journal}</h1>
		</div>
		<button
			type="button"
			class="cursor-pointer rounded-full px-3 py-1 text-sm font-semibold transition-all hover:bg-c-neutral-1 dark:hover:bg-s-dark-3"
			class:bg-c-primary={isToday}
			class:text-white={isToday}
			onclick={() => openDay(new Date())}
		>
			{ts.get.notes.today}
		</button>
		<button
			type="button"
			class="cursor-pointer rounded-full px-3 py-1 text-sm font-semibold transition-all hover:bg-c-neutral-1 dark:hover:bg-s-dark-3"
			class:bg-c-primary={isYesterday}
			class:text-white={isYesterday}
			onclick={() => openDay(getDateMinusDays(new Date(), 1))}
		>
			{ts.get.notes.yesterday}
		</button>
		<button
			type="button"
			class="cursor-pointer rounded-full px-3 py-1 text-sm font-semibold transition-all hover:bg-c-neutral-1 dark:hover:bg-s-dark-3"
			class:bg-c-primary={archiveOpen}
			class:text-white={archiveOpen}
			onclick={() => (archiveOpen = !archiveOpen)}
		>
			{ts.get.notes.other}
		</button>
	</div>

	{#if archiveOpen}
		<JournalArchivePicker {selectedDate} {markedDates} onSelect={openDay} />
	{/if}

	{#if notes.activeNote !== null && notes.isJournalNote(notes.activeNote)}
		<JournalHeader date={selectedDate} />
		{#key notes.activeNote.id}
			<TipTapEditor autofocus={isToday} />
		{/key}
	{:else if notes.loaded}
		<p class="text-c-neutral-5 dark:text-c-neutral-4">{ts.get.notes.journal_empty}</p>
	{/if}
</div>
