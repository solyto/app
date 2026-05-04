<script lang="ts">
	import type { Plant } from '$lib/types/library_plant';
	import { PlantLibrary } from '$lib/state/PlantLibrary.svelte.js';
	import Flag from '$lib/components/ui/Flag.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte.js';

	const ts = getTranslation();

	let { entry, library } = $props<{
		entry: Plant;
		library: PlantLibrary;
	}>();
</script>

{#if entry.wishlist}
	<Flag title={ts.get.libraries.wishlist} />
{/if}
<div class="text-left">
	<div class="font-bold">{entry.name}</div>
	{#if entry.latin_name}
		<div class="text-sm italic text-c-neutral-6">{entry.latin_name}</div>
	{/if}

</div>
