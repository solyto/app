<script lang="ts">
	import { onMount } from 'svelte';
	import { getCalendars } from '$lib/state/Calendars.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { formatDateWithoutYear, getCalendarWeek, getISODateInfo, isDateToday } from '$lib/helpers/DateHelper';
	import Day from '$lib/components/calendars/views/week/Day.svelte';
	import CalendarMarks from '$lib/components/calendars/CalendarMarks.svelte';

	const calendars = getCalendars();
	const ts = getTranslation();
	const hours = Array.from({ length: 24 }, (_, i) => i + 1).map((i) =>
		(i - 1).toString().padStart(2, '0')
	);
	const mobileRows = `minmax(4rem, auto) ${hours
		.map((hour) => (parseInt(hour) < 6 || parseInt(hour) >= 22 ? '1.5rem' : '3.5rem'))
		.join(' ')}`;

	let displayedWeek = $state(getCalendarWeek(calendars.currentYear, calendars.currentWeek));
	let prevYear = calendars.currentYear;
	let prevWeek = calendars.currentWeek;

	$effect(() => {
		const newYear = calendars.currentYear;
		const newWeek = calendars.currentWeek;
		if (newYear === prevYear && newWeek === prevWeek) return;
		prevYear = newYear;
		prevWeek = newWeek;
		displayedWeek = getCalendarWeek(newYear, newWeek);
	});

	onMount(() => {
		const iso = getISODateInfo(new Date());
		prevYear = iso.year;
		prevWeek = iso.week;
		calendars.currentYear = iso.year;
		calendars.currentWeek = iso.week;
		displayedWeek = getCalendarWeek(iso.year, iso.week);
	});

	function getWeekdayShort(date: Date): string {
		const weekday = date.getDay() || 7;
		return ts.get.calendar.weekdays_short[
			weekday as keyof typeof ts.get.calendar.weekdays_short
		];
	}
</script>

<div class="h-full w-full overflow-auto bg-c-bg dark:bg-s-dark">
	<div class="flex min-w-max flex-col pb-4">
		<div class="sticky top-0 z-20 flex bg-c-bg dark:bg-s-dark">
			<div class="sticky left-0 z-30 w-8 flex-shrink-0 bg-c-bg dark:bg-s-dark"></div>
			{#each displayedWeek as day (day.date.getTime())}
				<div
					class="flex h-8 flex-shrink-0 items-center justify-center relative"
					style="min-width: calc((100vw - 2rem) / 3); max-width: calc((100vw - 2rem) / 3)"
				>
					<span
						class="rounded-full px-2 py-0.5 text-xs"
						class:bg-c-primary={isDateToday(day.date)}
						class:text-white={isDateToday(day.date)}
						class:font-bold={isDateToday(day.date)}
					>
						{getWeekdayShort(day.date)}
						{formatDateWithoutYear(day.date)}
					</span>
					<CalendarMarks
						date={day.date}
						showJournal={calendars.journalMarksEnabled}
						showCheckIn={calendars.checkInMarksEnabled}
						class="absolute right-2"
					/>
				</div>
			{/each}
		</div>

		<div
			class="grid"
			style="grid-template-columns: 2rem repeat(7, calc((100vw - 2rem) / 3)); grid-template-rows: {mobileRows};"
		>
			<div
				class="sticky left-0 z-10 grid row-span-full bg-c-bg dark:bg-s-dark"
				style="grid-template-rows: subgrid;"
			>
				<div class="flex items-center justify-center">
				</div>
				{#each hours as hour (hour)}
					{@const offHour = parseInt(hour) < 6 || parseInt(hour) >= 22}
					<div class="flex items-center justify-center">
						<span class="text-xs {offHour ? 'text-c-neutral-4 dark:text-s-dark-3' : ''}">{hour}</span>
					</div>
				{/each}
			</div>

			{#each displayedWeek as day (day.date.getTime())}
				<div
					class="grid row-span-full overflow-hidden border-1 border-c-neutral-1 bg-c-bg-surface dark:border-s-dark"
					style="grid-template-rows: subgrid;"
				>
					<Day date={day.date} isMobile />
				</div>
			{/each}
		</div>
	</div>
</div>
