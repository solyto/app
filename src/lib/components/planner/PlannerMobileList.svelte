<script lang="ts">
	import { getPlanner } from '$lib/state/Planner.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import PlannerService from '$lib/services/PlannerService';
	import type { PlannerEntry } from '$lib/types/planner';
	import IconPlus from '@lucide/svelte/icons/plus';
	import PlannerEntryModal from '$lib/components/planner/PlannerEntryModal.svelte';
	import PlannerTodoColumn from '$lib/components/planner/PlannerTodoColumn.svelte';
	import PlannerDiaryWidget from '$lib/components/planner/PlannerDiaryWidget.svelte';
	import PlannerCheckInWidget from '$lib/components/planner/PlannerCheckInWidget.svelte';

	// Mobile strategy for the planner day: instead of a 24h timegrid, collapse
	// the day into a tappable, time-ordered list. Tapping a slot on a block
	// opens the entry editor; the + button adds a new one.
	const planner = getPlanner();
	const ts = getTranslation();
	const plannerService = new PlannerService();

	let entries = $derived(planner.getEntriesForDate(planner.selectedDay));
	let events = $derived(planner.getEventsForDate(planner.selectedDay));

	let modalOpen = $state(false);
	let editEntry: PlannerEntry | null = $state(null);

	const orderedBlocks = $derived(
		[...entries]
			.filter((e) => !e.is_all_day)
			.sort((a, b) => a.start_minutes - b.start_minutes || a.sort_order - b.sort_order)
	);

	const allDayBlocks = $derived(entries.filter((e) => e.is_all_day));
	const allDayEvents = $derived(events.filter((e) => e.is_all_day));
</script>

<div class="flex w-full flex-col gap-3">
	{#if allDayEvents.length > 0 || allDayBlocks.length > 0}
		<div class="flex flex-col gap-1">
			<span class="text-xs font-semibold uppercase opacity-60">{ts.get.planner.all_day}</span>
			{#each allDayEvents as event (event.uri)}
				<div
					class="rounded-md border-l-2 px-2 py-1.5 text-sm"
					style="border-color: {event.calendar_color}; background-color: color-mix(in srgb, {event.calendar_color} 20%, var(--color-c-bg-elevated));"
				>
					{event.title}
				</div>
			{/each}
			{#each allDayBlocks as entry (entry.id)}
				<button
					type="button"
					class="cursor-pointer rounded-md border-l-2 bg-c-action/20 px-2 py-1.5 text-left text-sm"
					style="border-color: {entry.color ?? 'var(--color-c-action)'};"
					onclick={() => {
						editEntry = entry;
						modalOpen = true;
					}}
				>
					{entry.title}
				</button>
			{/each}
		</div>
	{/if}

	<div class="flex flex-col gap-1">
		{#if orderedBlocks.length === 0 && events.filter((e) => !e.is_all_day).length === 0}
			<span class="py-6 text-center text-sm opacity-60">{ts.get.planner.no_entries}</span>
		{/if}
		{#each events
			.filter((e) => !e.is_all_day)
			.sort((a, b) => a.start_date.getTime() - b.start_date.getTime()) as event (event.uri)}
			<div
				class="rounded-md border-l-2 px-2 py-1.5 text-sm"
				style="border-color: {event.calendar_color}; background-color: color-mix(in srgb, {event.calendar_color} 20%, var(--color-c-bg-elevated));"
			>
				<span class="mr-2 text-xs opacity-70"
					>{plannerService.minutesToLabel(
						plannerService.toMinutesFromMidnight(event.start_date)
					)}</span
				>
				{event.title}
			</div>
		{/each}
		{#each orderedBlocks as entry (entry.id)}
			<button
				type="button"
				class="cursor-pointer rounded-md border-l-2 bg-c-action/20 px-2 py-1.5 text-left text-sm"
				style="border-color: {entry.color ?? 'var(--color-c-action)'};"
				onclick={() => {
					editEntry = entry;
					modalOpen = true;
				}}
			>
				<span class="mr-2 text-xs opacity-70"
					>{plannerService.minutesToLabel(entry.start_minutes)}</span
				>
				{entry.title}
			</button>
		{/each}
	</div>

	<button
		type="button"
		class="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-c-btn p-2 text-sm font-bold text-c-btn-text transition-all hover:bg-c-btn-hover"
		onclick={() => {
			editEntry = null;
			modalOpen = true;
		}}
	>
		<IconPlus class="size-4" />
		{ts.get.planner.add_entry}
	</button>

	<PlannerTodoColumn />
	<PlannerDiaryWidget />
	<PlannerCheckInWidget />
</div>

{#if modalOpen}
	<PlannerEntryModal entry={editEntry} onClose={() => (modalOpen = false)} />
{/if}
