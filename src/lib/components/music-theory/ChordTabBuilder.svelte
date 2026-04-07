<script lang="ts">
	let chord = $state<Chord>({
		name: 'C',
		fingering: [],
		barre: null,
		rootFret: null,
		strings: { open: [1, 2, 3, 4, 5, 6], muted: [] }
	});

	interface Finger {
		string: number;
		fret: number;
		finger: number;
	}

	interface Chord {
		name: string;
		fingering: Finger[];
		barre: number | null;
		rootFret: number | null;
		strings: { open: number[]; muted: number[] };
	}

	function translateString(string: number): string {
		return 6 - string;
	}
</script>

{#snippet verticalLine(i: number)}
	<div class="absolute z-10 h-full w-[1px] bg-black" style="left: {i * 20}%;"></div>
{/snippet}

{#snippet horizontalLine(i: number)}
	<div class="absolute z-10 h-[1px] w-full bg-black" style="top: {i * 20}%;"></div>
{/snippet}

{#snippet fingering(f: Fingering)}
	<div
		class="absolute z-20 flex size-6 items-center justify-center rounded-full bg-black text-white"
		style="top: {5 + 20 * (f.fret - 1)}%; left: {-6 + 20 * translateString(f.string)}%;"
	>
		{f.finger}
	</div>
{/snippet}

{#snippet chordName(chord: Chord)}
	<div class="mb-4 flex w-50 justify-center text-2xl font-bold">
		<span>{chord.name}</span>
	</div>
{/snippet}

{#snippet stringPlayings()}
	<div class="relative h-6 w-50">
		{#each Array(6) as _, i ('string' + i)}
			<div
				class="absolute text-lg font-bold"
				style="right: {-23 + translateString(i) * 20}%; top: -10px;"
			>
				{#if chord.strings.open.includes(translateString(i))}
					<button
						class="h-8 w-4"
						onclick={() => {
							chord.strings.open = chord.strings.open.filter(
								(s) => s !== translateString(i)
							);
							chord.strings.muted = [...chord.strings.muted, translateString(i)];
						}}
					>
						O
					</button>
				{:else if chord.strings.muted.includes(translateString(i))}
					<button
						class="h-8 w-4"
						onclick={() => {
							chord.strings.muted = chord.strings.muted.filter(
								(s) => s !== translateString(i)
							);
						}}
					>
						X
					</button>
				{:else}
					<button
						class="h-8 w-4"
						onclick={() => {
							chord.strings.open = [...chord.strings.open, translateString(i)];
						}}
					>
					</button>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}

{#snippet barre(i: number)}
	<div
		class="absolute h-[10px] w-[calc(100%+10px)] rounded-full bg-black"
		style="top: {-12 + i * 20}%; left: -5px"
	></div>
{/snippet}

{#snippet rootFret(i: number)}
	<div class="absolute top-[12px] left-[-25px]">
		{i}
	</div>
{/snippet}

<div class="h-full w-full flex-col items-center justify-center">
	{@render chordName(chord)}
	{@render stringPlayings()}
	<div class="relative flex h-60 w-50 flex-col border-1 border-black">
		{#if chord.rootFret}
			{@render rootFret(chord.rootFret)}
		{/if}
		<div class="absolute top-[-5px] left-[-3px] h-[5px] w-[calc(100%+6px)] bg-black"></div>
		{#each Array(4) as _, i ('vline' + i)}
			{@render verticalLine(i + 1)}
		{/each}
		{#each Array(4) as _, i ('hline' + i)}
			{@render horizontalLine(i + 1)}
		{/each}
		{#if chord.barre}
			{@render barre(chord.barre)}
		{/if}
		{#each chord.fingering as f, i ('fingering' + i)}
			{@render fingering(f)}
		{/each}
	</div>
</div>
