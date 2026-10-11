<script lang="ts">
	import { getCalendars } from '$lib/state/Calendars.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import CalendarWeekDay from '$lib/components/calendars/views/week/Day.svelte';
	import CalendarMarks from '$lib/components/calendars/CalendarMarks.svelte';

	const calendars = getCalendars();
	const ts = getTranslation();
	const hours = Array.from({ length: 24 }, (_, i) => i + 1).map((i) =>
		(i - 1).toString().padStart(2, '0')
	);
	const rows = '10% repeat(24, calc(100% / 27))';
</script>

<div class="flex h-full w-full dark:bg-s-dark" style="background-color: color-mix(in srgb, var(--color-c-primary) 12%, var(--color-c-bg));">
	<div class="grid h-full w-8" style="grid-template-rows: {rows};">
		<div class="flex flex-col items-center justify-center">
			<CalendarMarks
				date={calendars.currentDate}
				showJournal={calendars.journalMarksEnabled}
				showCheckIn={calendars.checkInMarksEnabled}
				class="flex flex-col"
			/>
		</div>
		{#each hours as hour (hour)}
			<div class="flex items-center justify-center">
				<span class="text-sm">{hour}</span>
			</div>
		{/each}
	</div>
	<div class="flex h-full w-full flex-col">
		<div
			class="flex h-full w-full flex-col border-1 border-c-neutral-1 bg-c-bg-surface shadow-lg dark:border-s-dark"
		>
			<CalendarWeekDay date={calendars.currentDate} />
		</div>
	</div>
</div>
