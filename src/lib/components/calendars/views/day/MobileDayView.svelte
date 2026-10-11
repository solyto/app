<script lang="ts">
	import { getCalendars } from '$lib/state/Calendars.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { SwipeNavigate } from '$lib/helpers/SwipeNavigate.svelte';
	import CalendarWeekDay from '$lib/components/calendars/views/week/Day.svelte';
	import CalendarMarks from '$lib/components/calendars/CalendarMarks.svelte';

	const calendars = getCalendars();
	const ts = getTranslation();
	const hours = Array.from({ length: 24 }, (_, i) => i + 1).map((i) =>
		(i - 1).toString().padStart(2, '0')
	);
	const mobileRows = `minmax(4rem, auto) ${hours
		.map((hour) => (parseInt(hour) < 6 || parseInt(hour) >= 22 ? '1.5rem' : '3.5rem'))
		.join(' ')}`;

	const swipe = new SwipeNavigate({
		onLeft: () => calendars.nextDay(),
		onRight: () => calendars.lastDay(),
		duration: 120
	});

	let contentEl: HTMLDivElement;
	$effect(() => { if (contentEl) swipe.setTarget(contentEl); });
</script>

<div
	class="flex h-full w-full flex-col bg-c-bg dark:bg-s-dark"
	style="touch-action: pan-y;"
	{...swipe.handlers}
>
	<div class="flex overflow-y-auto">
		<div class="grid w-full self-start" style="grid-template-columns: 2rem 1fr; grid-template-rows: {mobileRows};">
			<div class="grid row-span-full bg-c-bg dark:bg-s-dark" style="grid-template-rows: subgrid;">
				<div class="flex items-center justify-center">
					<CalendarMarks
						date={calendars.currentDate}
						showJournal={calendars.journalMarksEnabled}
						showCheckIn={calendars.checkInMarksEnabled}
						class="flex flex-col"
					/>
				</div>
				{#each hours as hour (hour)}
					{@const offHour = parseInt(hour) < 6 || parseInt(hour) >= 22}
					<div class="flex items-center justify-center">
						<span class="text-xs {offHour ? 'text-c-neutral-4 dark:text-s-dark-3' : ''}">{hour}</span>
					</div>
				{/each}
			</div>
			<div
				bind:this={contentEl}
				class="grid row-span-full border-1 border-c-neutral-1 bg-c-bg-surface shadow-lg dark:border-s-dark"
				style="grid-template-rows: subgrid; overflow-x: clip;"
			>
				<div
					class="grid row-span-full"
					style="grid-template-rows: subgrid; {swipe.style}"
				>
					<CalendarWeekDay date={calendars.currentDate} isMobile />
				</div>
			</div>
		</div>
	</div>
</div>
