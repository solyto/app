<!-- $lib/components/ChordBuilder.svelte -->
<script lang="ts">
	import { getMajorScaleByKey, getChordProgressionInKey } from '$lib/helpers/MusicTheoryHelper';
	import { onMount } from 'svelte';
	import type { ProgressionChord } from '$lib/types/music_theory';

	let selectedKey = $state('C');
	let progression = $state<number[]>([1, 4, 5, 1]);
	let chords = $state<ProgressionChord[]>([]);
	let scale = $state<string[]>([]);

	// Include keys with sharps and flats
	const keys = [
		// Natural notes as keys
		'C',
		'D',
		'E',
		'F',
		'G',
		'A',
		'B',

		// Sharp notes as keys
		'C#',
		'D#',
		'E#',
		'F#',
		'G#',
		'A#',
		'B#',

		// Flat notes as keys
		'Cb',
		'Db',
		'Eb',
		'Fb',
		'Gb',
		'Ab',
		'Bb',

		// Double sharp notes (theoretical but included for completeness)
		'Cx',
		'Dx',
		'Ex',
		'Fx',
		'Gx',
		'Ax',
		'Bx',

		// Double flat notes (theoretical but included for completeness)
		'Cbb',
		'Dbb',
		'Ebb',
		'Fbb',
		'Gbb',
		'Abb',
		'Bbb'
	];

	function updateProgression() {
		try {
			scale = getMajorScaleByKey(selectedKey);
			chords = getChordProgressionInKey(selectedKey, progression);
		} catch (error) {
			console.error(`Error generating progression for key ${selectedKey}:`, error);
			// Fallback to C if there's an error
			if (selectedKey !== 'C') {
				selectedKey = 'C';
				updateProgression();
			}
		}
	}

	function handleKeyChange(event: Event) {
		selectedKey = (event.target as HTMLSelectElement).value;
		updateProgression();
	}

	function formatChordSymbol(chord: ProgressionChord): string {
		// Handle special cases for chord types
		switch (chord.type) {
			case 'Minor':
				return `${chord.root}m`;
			case 'Diminished':
				return `${chord.root}dim`;
			case 'Augmented':
				return `${chord.root}aug`;
			case 'Major 7th':
				return `${chord.root}maj7`;
			case 'Minor 7th':
				return `${chord.root}m7`;
			case 'Dominant 7th':
				return `${chord.root}7`;
			default:
				return chord.root;
		}
	}

	onMount(() => {
		updateProgression();
	});
</script>

<div class="h-full w-full flex-col items-center justify-center p-4">
	<h2 class="mb-4 text-xl font-bold">{selectedKey} Major Scale</h2>
	<div class="mb-6">{scale.join(', ')}</div>

	<div class="mb-4">
		<label for="key-select" class="mr-2">Key:</label>
		<select
			id="key-select"
			bind:value={selectedKey}
			onchange={handleKeyChange}
			class="w-20 rounded border p-1"
		>
			{#each keys as key (key)}
				<option value={key}>{key}</option>
			{/each}
		</select>
	</div>

	<h3 class="mb-2 text-lg font-semibold">Chord Progression</h3>
	<div class="mb-6 flex flex-wrap gap-4">
		{#each chords as chord, i (i)}
			<div class="rounded bg-c-neutral-1 p-3 shadow">
				<div class="font-bold">{formatChordSymbol(chord)}</div>
				<div class="text-sm">{chord.notes.join(', ')}</div>
			</div>
		{/each}
	</div>
</div>
