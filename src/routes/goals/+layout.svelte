<script lang="ts">
	import { fade } from 'svelte/transition';
	import { setCheckInData } from '$lib/state/CheckInData.svelte';
	import { setGoals } from '$lib/state/Goals.svelte';

	let { children } = $props();

	setCheckInData();
	setGoals();
</script>

<div class="flex flex-col p-2 xl:p-8" in:fade>
	{@render children?.()}
</div>
