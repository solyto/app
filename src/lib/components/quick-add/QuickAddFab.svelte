<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { getQuickAdd } from '$lib/state/QuickAdd.svelte';
	import IconPlus from '@lucide/svelte/icons/plus';
	import { getTranslation } from '$lib/state/Translation.svelte';

	const quickAdd = getQuickAdd();
	const ts = getTranslation();
</script>

<button
	class="fixed right-6 bottom-24 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-c-action text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95 md:right-10 md:bottom-10 dark:bg-c-action"
	onclick={() => quickAdd.openModal()}
	title={ts.get.quick_add.title}
	in:scale={{ start: 0.5 }}
	out:fade={{ duration: 150 }}
>
	<IconPlus class="h-7 w-7" />
</button>
