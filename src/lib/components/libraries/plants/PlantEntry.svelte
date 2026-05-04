<script lang="ts">
	import type { Plant } from '$lib/types/library_plant';
	import { PlantLibrary } from '$lib/state/PlantLibrary.svelte.js';

	let { entry, library } = $props<{
		entry: Plant;
		library: PlantLibrary;
	}>();
</script>

<div class="text-left">
	<div class="font-bold">{entry.name}</div>
	{#if entry.latin_name}
		<div class="text-sm italic text-c-neutral-6">{entry.latin_name}</div>
	{/if}

</div>
