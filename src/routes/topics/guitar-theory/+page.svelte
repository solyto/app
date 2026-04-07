<script lang="ts">
	import ChordTab from '$lib/components/music-theory/ChordTab.svelte';
	import GuitarFretboard from '$lib/components/music-theory/GuitarFretboard.svelte';
	import ChordBuilder from '$lib/components/music-theory/ChordBuilder.svelte';
	import GuitarTheoryNavigation from '$lib/components/guitar/GuitarTheoryNavigation.svelte';
	import ChordTabBuilder from '$lib/components/music-theory/ChordTabBuilder.svelte';

	const chords = [
		{
			note: 'C',
			type: 'major',
			fingering: [
				{ string: 2, fret: 1, finger: 1 },
				{ string: 4, fret: 2, finger: 2 },
				{ string: 5, fret: 3, finger: 3 }
			],
			strings: {
				open: [1, 3],
				muted: [6]
			}
		},
		{
			note: 'E',
			type: 'minor',
			fingering: [
				{ string: 5, fret: 2, finger: 2 },
				{ string: 4, fret: 2, finger: 1 }
			],
			strings: {
				open: [1, 2, 3, 6],
				muted: []
			}
		},
		{
			note: 'A',
			type: 'minor',
			fingering: [],
			rootFret: 5,
			barre: 1,
			strings: {
				open: [],
				muted: []
			}
		},
		{
			note: 'B',
			type: 'major',
			fingering: [
				{ string: 3, fret: 2, finger: 2 },
				{ string: 4, fret: 3, finger: 3 },
				{ string: 5, fret: 3, finger: 4 }
			],
			rootFret: 7,
			barre: 1,
			strings: {
				open: [],
				muted: []
			}
		}
	];

	let selected = $state<string>('chords');

	function onSelect(key: string) {
		selected = key;
	}
</script>

<div class="flex flex-col gap-12 p-8">
	<GuitarTheoryNavigation {selected} {onSelect} />
	{#if selected === 'chords'}
		<div class="flex flex-row gap-4">
			{#each chords as chord}
				<ChordTab {chord} />
			{/each}
		</div>
		<ChordTabBuilder />
	{/if}
	{#if selected === 'fretboard'}
		<GuitarFretboard />
	{/if}
	{#if selected === 'chord-builder'}
		<ChordBuilder />
	{/if}
</div>
