<script lang="ts">
	import { getPlanner } from '$lib/state/Planner.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import CalendarDragService from '$lib/services/CalendarDragService';
	import PlannerService from '$lib/services/PlannerService';
	import type { PlannerEntry } from '$lib/types/planner';
	import IconPlus from '@lucide/svelte/icons/plus';
	import IconGripVertical from '@lucide/svelte/icons/grip-vertical';
	import PlannerEntryModal from '$lib/components/planner/PlannerEntryModal.svelte';

	// One selected day rendered as a timegrid. Layers:
	// - all-day strip (read-only calendar events + planner all-day blocks)
	// - read-only calendar events (never draggable)
	// - editable planner blocks: drag to move, click to edit
	// - click on an empty hour slot opens the add modal pre-filled at that hour

	const planner = getPlanner();
	const ts = getTranslation();
	const dragService = new CalendarDragService();
	const plannerService = new PlannerService();

	const HOUR_SLOTS = Array.from({ length: 24 }, (_, i) => i);

	let entries = $derived(planner.getEntriesForDate(planner.selectedDay));
	let events = $derived(planner.getEventsForDate(planner.selectedDay));

	let modalOpen = $state(false);
	let editEntry: PlannerEntry | null = $state(null);
	let defaultStart = $state(9 * 60);

	// Drag state for a planner block's top (move).
	let draggingId: number | null = $state(null);
	let dragNewStart = $state<number | null>(null);
	let gridEl: HTMLDivElement;

	function minutesFromClientY(clientY: number): number {
		const rect = gridEl.getBoundingClientRect();
		const contentTop = rect.top + 32; // all-day strip height
		const contentHeight = rect.height - 32;
		const ratio = (clientY - contentTop) / contentHeight;
		return dragService.snapToMinutes(Math.round(ratio * 24 * 60));
	}

	function onBlockPointerDown(event: PointerEvent, entry: PlannerEntry): void {
		event.stopPropagation();
		draggingId = entry.id;
		dragNewStart = entry.start_minutes;
	}

	function onGridPointerMove(event: PointerEvent): void {
		if (draggingId === null) return;
		const minutes = Math.min(Math.max(minutesFromClientY(event.clientY), 0), 24 * 60 - 15);
		dragNewStart = minutes;
	}

	async function onGridPointerUp(): Promise<void> {
		if (draggingId === null || dragNewStart === null) return;

		if (draggingId !== -1) {
			await planner.updateEntry(draggingId, { start_minutes: dragNewStart });
		}

		resetDrag();
	}

	function resetDrag(): void {
		draggingId = null;
		dragNewStart = null;
	}

	function openAdd(event: MouseEvent): void {
		// A plain click on the empty grid opens the add modal at that hour.
		const minutes = Math.min(Math.max(minutesFromClientY(event.clientY), 0), 23 * 60);
		defaultStart = minutes;
		editEntry = null;
		modalOpen = true;
	}

	function openEdit(entry: PlannerEntry): void {
		editEntry = entry;
		modalOpen = true;
	}

	function blockStyle(entry: PlannerEntry): string {
		const start =
			dragNewStart !== null && draggingId === entry.id ? dragNewStart : entry.start_minutes;
		const top = plannerService.minutesToPercent(start);
		const height = plannerService.minutesToPercent(entry.duration_minutes);
		const bg = entry.color ?? 'var(--color-c-primary)';
		const entryBg = `color-mix(in srgb, ${bg} 30%, var(--color-c-bg-elevated))`;
		return `top: ${top}%; height: ${height}%; background-color: ${entryBg}; border-color: ${bg};`;
	}

	function eventStyle(clip: { start: number; end: number }): string {
		const top = plannerService.minutesToPercent(clip.start);
		const height = plannerService.minutesToPercent(clip.end - clip.start);
		return `top: ${top}%; height: ${height}%;`;
	}
</script>

<div class="flex h-full w-full overflow-hidden">
	<!-- hour gutter -->
	<div class="flex h-full w-10 flex-none flex-col">
		<div class="flex h-8 w-full items-center justify-center text-xs opacity-60">
			{ts.get.planner.all_day}
		</div>
		{#each HOUR_SLOTS as hour (hour)}
			<div class="flex h-[4.1666%] w-full items-end justify-end pr-1 text-[10px] opacity-50">
				{String(hour).padStart(2, '0')}:00
			</div>
		{/each}
	</div>

	<!-- grid area -->
	<div
		bind:this={gridEl}
		class="relative flex h-full min-w-0 flex-1 flex-col border-1 border-c-neutral-1 dark:border-s-dark"
		onpointermove={onGridPointerMove}
		onpointerup={onGridPointerUp}
		onpointercancel={resetDrag}
		onclick={openAdd}
	>
		<!-- all-day strip -->
		<div
			class="flex h-8 w-full flex-none gap-0.5 overflow-y-auto border-b-1 border-c-neutral-1 p-0.5 dark:border-s-dark"
		>
			{#each events.filter((e) => e.is_all_day) as event (event.uri)}
				<div
					class="h-max rounded-sm border-l-2 px-1.5 py-0.5 text-xs"
					style="border-color: {event.calendar_color}; background-color: color-mix(in srgb, {event.calendar_color} 20%, var(--color-c-bg-elevated));"
				>
					{event.title}
				</div>
			{/each}
			{#each entries.filter((e) => e.is_all_day) as entry (entry.id)}
				<button
					type="button"
					class="h-max cursor-pointer rounded-sm border-l-2 bg-c-action/20 px-1.5 py-0.5 text-xs"
					style="border-color: {entry.color ?? 'var(--color-c-action)'};"
					onclick={(e) => {
						e.stopPropagation();
						openEdit(entry);
					}}
				>
					{entry.title}
				</button>
			{/each}
			{#if events.filter((e) => e.is_all_day).length === 0 && entries.filter((e) => e.is_all_day).length === 0}
				<span class="px-1 py-0.5 text-xs opacity-50">{ts.get.planner.no_events}</span>
			{/if}
		</div>

		<!-- hour tick lines -->
		<div class="pointer-events-none absolute top-8 right-0 bottom-0 left-0">
			{#each HOUR_SLOTS as hour (hour)}
				<div
					class="absolute right-0 left-0 border-t-1 border-c-neutral-1/50 dark:border-s-dark"
					style="top: {hour * 4.1666}%;"
				></div>
			{/each}
		</div>

		<!-- read-only events -->
		{#each events.filter((e) => !e.is_all_day) as event (event.uri)}
			{@const clip = plannerService.getEventOverlapMinutes(event, planner.selectedDay)}
			{#if clip}
				<div
					class="pointer-events-none absolute right-0 left-0 z-10 mx-0.5 overflow-hidden rounded-sm border-l-2 px-1.5 py-0.5 text-xs"
					style="border-color: {event.calendar_color}; background-color: color-mix(in srgb, {event.calendar_color} 25%, var(--color-c-bg-elevated)); {eventStyle(
						clip
					)}"
				>
					{plannerService.minutesToLabel(clip.start)}
					{event.title}
				</div>
			{/if}
		{/each}

		<!-- editable planner blocks -->
		{#each entries.filter((e) => !e.is_all_day) as entry (entry.id)}
			{@const isDragging = draggingId === entry.id}
			<div
				class="group absolute right-0 left-0 z-20 mx-0.5 cursor-grab overflow-hidden rounded-sm border-l-2 px-1.5 py-0.5 text-xs select-none"
				style={blockStyle(entry)}
				class:opacity-70={isDragging}
				onpointerdown={(e) => onBlockPointerDown(e, entry)}
				onclick={(e) => {
					e.stopPropagation();
					openEdit(entry);
				}}
			>
				<div
					class="absolute inset-y-0 left-0 flex items-center opacity-0 transition-opacity group-hover:opacity-60"
				>
					<IconGripVertical class="size-3" />
				</div>
				<span class="ml-4 flex items-center gap-1">
					{plannerService.minutesToLabel(
						isDragging && dragNewStart !== null ? dragNewStart : entry.start_minutes
					)}
					{entry.title}
				</span>
			</div>
		{/each}

		<button
			type="button"
			class="absolute right-2 bottom-2 z-40 flex cursor-pointer items-center gap-1 rounded-full bg-c-btn p-2 text-xs font-bold text-c-btn-text transition-all hover:bg-c-btn-hover"
			onclick={(e) => {
				e.stopPropagation();
				defaultStart = 9 * 60;
				editEntry = null;
				modalOpen = true;
			}}
		>
			<IconPlus class="size-3" />
			{ts.get.planner.add_entry}
		</button>
	</div>
</div>

{#if modalOpen}
	<PlannerEntryModal entry={editEntry} {defaultStart} onClose={() => (modalOpen = false)} />
{/if}
