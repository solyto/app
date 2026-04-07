<script lang="ts">
	import { generateChord, chords } from '$lib/helpers/MusicTheoryHelper';
	import type { Chord } from '$lib/types/music_theory';

	interface GuitarString {
		notes: string[];
	}

	// Define available chord types for selection
	const availableChords: Record<string, Chord> = {
		major: chords.major,
		minor: chords.minor,
		diminished: chords.diminished,
		augmented: chords.augmented,
		dominant7: chords.dominant7,
		major7: chords.major7,
		minor7: chords.minor7
	};

	// Define available root notes for selection
	const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

	const strings: GuitarString[] = [
		{
			notes: [
				'E',
				'F',
				'F#',
				'G',
				'G#',
				'A',
				'A#',
				'B',
				'C',
				'C#',
				'D',
				'D#',
				'E',
				'F',
				'F#',
				'G',
				'G#',
				'A',
				'A#',
				'B',
				'C',
				'C#'
			]
		},
		{
			notes: [
				'B',
				'C',
				'C#',
				'D',
				'D#',
				'E',
				'F',
				'F#',
				'G',
				'G#',
				'A',
				'A#',
				'B',
				'C',
				'C#',
				'D',
				'D#',
				'E',
				'F',
				'F#',
				'G',
				'G#'
			]
		},
		{
			notes: [
				'G',
				'G#',
				'A',
				'A#',
				'B',
				'C',
				'C#',
				'D',
				'D#',
				'E',
				'F',
				'F#',
				'G',
				'G#',
				'A',
				'A#',
				'B',
				'C',
				'C#',
				'D',
				'D#',
				'E'
			]
		},
		{
			notes: [
				'D',
				'D#',
				'E',
				'F',
				'F#',
				'G',
				'G#',
				'A',
				'A#',
				'B',
				'C',
				'C#',
				'D',
				'D#',
				'E',
				'F',
				'F#',
				'G',
				'G#',
				'A',
				'A#',
				'B'
			]
		},
		{
			notes: [
				'A',
				'A#',
				'B',
				'C',
				'C#',
				'D',
				'D#',
				'E',
				'F',
				'F#',
				'G',
				'G#',
				'A',
				'A#',
				'B',
				'C',
				'C#',
				'D',
				'D#',
				'E',
				'F',
				'F#'
			]
		},
		{
			notes: [
				'E',
				'F',
				'F#',
				'G',
				'G#',
				'A',
				'A#',
				'B',
				'C',
				'C#',
				'D',
				'D#',
				'E',
				'F',
				'F#',
				'G',
				'G#',
				'A',
				'A#',
				'B',
				'C',
				'C#'
			]
		}
	];

	// State variables
	let hoveredNote = $state<string | null>(null);
	let selectedNote = $state<string | null>(null);
	let selectedRootNote = $state<string>('C');
	let selectedChordType = $state<string>('major');
	let chordNotes = $state<string[]>([]);
	let showChord = $state<boolean>(false);

	// Normalize note name (handle any potential octave indicators)
	function normalizeNote(note: string): string {
		// This simplifies handling by focusing just on the note name
		return note.replace(/\d+$/, '');
	}

	// Event handlers for individual note interaction
	function handleMouseEnter(note: string) {
		if (!showChord) {
			hoveredNote = normalizeNote(note);
		}
	}

	function handleMouseLeave() {
		hoveredNote = null;
	}

	function onSelectNote(note: string) {
		const normalizedNote = normalizeNote(note);

		// In chord mode, clicking a note sets it as the root
		if (showChord) {
			selectedRootNote = normalizedNote;
			updateChordNotes();
			return;
		}

		// In note mode, toggle selection
		if (selectedNote === normalizedNote) {
			selectedNote = null;
		} else {
			selectedNote = normalizedNote;
		}
	}

	// Chord management functions
	function updateChordNotes() {
		if (selectedRootNote && selectedChordType) {
			const chord = availableChords[selectedChordType];
			chordNotes = generateChord(selectedRootNote, chord);
		} else {
			chordNotes = [];
		}
	}

	function toggleChordDisplay() {
		showChord = !showChord;

		if (showChord) {
			// Entering chord mode - update chord notes and clear note selection
			updateChordNotes();
			hoveredNote = null;
		} else {
			// Exiting chord mode - clear chord notes
			chordNotes = [];
		}
	}

	function handleRootNoteChange(event: Event) {
		selectedRootNote = (event.target as HTMLSelectElement).value;
		updateChordNotes();
	}

	function handleChordTypeChange(event: Event) {
		selectedChordType = (event.target as HTMLSelectElement).value;
		updateChordNotes();
	}

	// Visual styling functions
	function shouldHighlightNote(note: string): boolean {
		const normalizedNote = normalizeNote(note);

		if (showChord) {
			// In chord mode, highlight notes that are part of the chord
			return chordNotes.some((chordNote) => normalizeNote(chordNote) === normalizedNote);
		} else {
			// In note mode, highlight hovered or selected notes
			return normalizedNote === hoveredNote || normalizedNote === selectedNote;
		}
	}

	function isRootNote(note: string): boolean {
		return showChord && normalizeNote(note) === selectedRootNote;
	}

	function getNoteClassNames(note: string): string {
		const classes = ['transition-all', 'duration-200'];

		if (shouldHighlightNote(note)) {
			classes.push('scale-115', 'shadow-lg', 'z-30');

			// Special styling for root note in chord mode
			if (isRootNote(note)) {
				classes.push('scale-125', 'border-2', 'border-white', 'z-40');
			}
		} else if (showChord) {
			// Dim notes not in chord when in chord mode
			classes.push('opacity-30');
		}

		return classes.join(' ');
	}

	function getNoteColor(note: string): string {
		// If in chord mode and note not in chord, or
		// if not in chord mode and a different note is hovered/selected
		if (!shouldHighlightNote(note)) {
			if (showChord || hoveredNote || selectedNote) {
				return '#D3D3D3'; // Dim color
			}
		}

		// Normal note coloring
		const normalizedNote = normalizeNote(note);
		switch (normalizedNote) {
			case 'E':
				return '#00aed2';
			case 'F':
				return '#018ccd';
			case 'F#':
				return '#0070c8';
			case 'G':
				return '#8a4a96';
			case 'G#':
				return '#bd4370';
			case 'A':
				return '#f33b45';
			case 'A#':
				return '#f77339';
			case 'B':
				return '#faac2e';
			case 'C':
				return '#f6e526';
			case 'C#':
				return '#b0d13f';
			case 'D':
				return '#6abc58';
			case 'D#':
				return '#33b595';
			default:
				return '#888888';
		}
	}

	function getChordName(): string {
		const chord = availableChords[selectedChordType];
		return `${selectedRootNote}${chord.symbol}`;
	}
</script>

{#snippet verticalLine(i: number)}
	<div class="absolute z-10 h-full w-[1px] bg-black" style="left: {i * 5}%;"></div>
{/snippet}

{#snippet horizontalLine(i: number)}
	<div class="absolute z-10 h-[1px] w-full bg-black" style="top: {i * 20}%;"></div>
{/snippet}

{#snippet notePlacement(string: number, fret: number, note: string)}
	<button
		class="absolute z-20 flex size-8 items-center justify-center rounded-full text-white {getNoteClassNames(
			note
		)}"
		class:scale-115={hoveredNote === normalizeNote(note)}
		class:shadow-lg={hoveredNote === normalizeNote(note)}
		style="top: {-8 + string * 20}%; left: calc(-18px + {fret *
			5.01}%); background-color: {getNoteColor(note)};"
		onmouseenter={() => handleMouseEnter(note)}
		onmouseleave={handleMouseLeave}
		onclick={() => onSelectNote(note)}
	>
		{note}
	</button>
{/snippet}

<div class="flex h-full w-full flex-col items-center">
	<div class="mb-8 flex min-h-14 items-center gap-4 text-2xl font-bold">
		{#if showChord}
			<span
				class="rounded-full px-3 py-1 text-white"
				style="background-color: {getNoteColor(normalizeNote(selectedRootNote))}"
			>
				{getChordName()}
			</span>
			<div>{chordNotes.join(', ')}</div>
		{:else if selectedNote}
			{selectedNote}
		{:else if hoveredNote}
			{hoveredNote}
		{/if}
	</div>

	<div class="relative flex h-50 w-full flex-col border-1 border-black">
		<div class="absolute top-[-3px] left-[-5px] h-[calc(100%+6px)] w-[5px] bg-black"></div>
		<div class="absolute top-0 h-full w-[2px] bg-black" style="left: 60%;"></div>

		{#each Array(20) as _, i ('vline' + i)}
			{@render verticalLine(i + 1)}
		{/each}

		{#each Array(4) as _, i ('hline' + i)}
			{@render horizontalLine(i + 1)}
		{/each}

		{#each strings as string, i ('string' + i)}
			{#each string.notes as note, j ('note' + i + j)}
				{@render notePlacement(i, j, note)}
			{/each}
		{/each}
	</div>

	<div class="mt-20 flex w-full flex-col items-center justify-between gap-4 md:flex-row">
		<div class="flex items-center gap-2">
			<label for="root-select" class="font-medium">Root Note:</label>
			<select
				id="root-select"
				bind:value={selectedRootNote}
				onchange={handleRootNoteChange}
				class="w-20 rounded border p-1"
			>
				{#each rootNotes as note (note)}
					<option value={note}>{note}</option>
				{/each}
			</select>
		</div>

		<div class="flex items-center gap-2">
			<label for="chord-select" class="font-medium">Chord Type:</label>
			<select
				id="chord-select"
				bind:value={selectedChordType}
				onchange={handleChordTypeChange}
				class="rounded border p-1"
			>
				{#each Object.entries(availableChords) as [value, chord] (value)}
					<option {value}>{chord.name}</option>
				{/each}
			</select>
		</div>

		<button
			class="w-36 cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
			onclick={toggleChordDisplay}
		>
			{showChord ? 'Hide Chord' : 'Show Chord'}
		</button>
	</div>
</div>
