<script lang="ts">
	import IconGoal from '@lucide/svelte/icons/goal';
	import { getPlanner } from '$lib/state/Planner.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { urls } from '$lib/config/urls';
	import { resolve } from '$app/paths';
	import { getUrlFormat } from '$lib/helpers/DateHelper';

	// Widget: shows whether the day has a check-in and links into the day's
	// check-in page. Inline editing can grow later (check-in owns the editor).
	const planner = getPlanner();
	const ts = getTranslation();

	const checkIn = $derived(planner.getCheckInForDate(planner.selectedDay));
	const href = $derived(resolve(urls.checkInDate, { date: getUrlFormat(planner.selectedDay) }));
	const hasValues = $derived.by(() => {
		if (!checkIn) return false;
		return (
			checkIn.mood !== null ||
			checkIn.sports !== null ||
			checkIn.water !== null ||
			checkIn.sleep !== null ||
			checkIn.work !== null ||
			checkIn.social_life !== null
		);
	});
</script>

<a
	{href}
	class="flex w-full cursor-pointer items-center gap-2 rounded-lg border-1 border-c-neutral-1 p-3 transition-all hover:bg-c-neutral dark:border-s-dark dark:hover:bg-s-dark-3"
>
	<IconGoal class="size-4 text-c-primary" />
	<span class="text-sm font-semibold">{ts.get.planner.check_in}</span>
	{#if hasValues}
		<span class="ml-auto size-2 rounded-full bg-c-success"></span>
	{/if}
</a>
