<script lang="ts">
	import { tick } from 'svelte';
	import { useSwipe } from 'svelte-gestures';
	import { getCalendars } from '$lib/state/Calendars.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import CalendarWeekDay from '$lib/components/calendars/views/week/Day.svelte';

	const calendars = getCalendars();
	const ts = getTranslation();
	const hours = Array.from({ length: 24 }, (_, i) => i + 1).map((i) =>
		(i - 1).toString().padStart(2, '0')
	);
	const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

	let isAnimating = $state(false);
	let translateX = $state(0);
	let transitioning = $state(false);
	let contentEl: HTMLDivElement;

	async function animateNavigation(dir: 'left' | 'right'): Promise<void> {
		if (isAnimating) return;
		isAnimating = true;

		transitioning = true;
		translateX = dir === 'left' ? -100 : 100;
		await sleep(120);

		transitioning = false;
		if (dir === 'left') calendars.nextDay();
		else calendars.lastDay();
		translateX = dir === 'left' ? 100 : -100;
		await tick();
		void contentEl?.offsetWidth;

		transitioning = true;
		translateX = 0;
		await sleep(120);

		transitioning = false;
		isAnimating = false;
	}
</script>

<div
	class="flex h-full w-full flex-col bg-c-bg dark:bg-s-dark"
	{...useSwipe(
		(e) => {
			if (e.detail.direction === 'left') animateNavigation('left');
			else if (e.detail.direction === 'right') animateNavigation('right');
		},
		() => ({ timeframe: 300, minSwipeDistance: 60, touchAction: 'pan-y' })
	)}
>
	<div class="flex flex-1 overflow-y-auto">
		<!-- hour label gutter -->
		<div class="flex w-8 flex-shrink-0 flex-col">
			<div class="flex h-16 w-full flex-shrink-0 items-center justify-center">
				<span class="px-1 text-center text-xs">{ts.get.calendar.is_all_day}</span>
			</div>
			{#each hours as hour (hour)}
				{@const offHour = parseInt(hour) < 6 || parseInt(hour) >= 22}
				<div class="flex {offHour ? 'h-6' : 'h-14'} w-full flex-shrink-0 items-center justify-center">
					<span class="text-xs {offHour ? 'text-c-neutral-4 dark:text-s-dark-3' : ''}">{hour}</span>
				</div>
			{/each}
		</div>

		<!-- animated day content -->
		<div class="min-w-0 flex-1" style="overflow-x: clip">
			<div
				bind:this={contentEl}
				class="flex w-full flex-col"
				style="transform: translateX({translateX}%);{transitioning
					? ' transition: transform 120ms cubic-bezier(0.33, 1, 0.68, 1);'
					: ''}"
			>
				<div
					class="flex w-full flex-col border-1 border-c-neutral-1 bg-c-bg-surface dark:border-s-dark"
				>
					<CalendarWeekDay date={calendars.currentDate} fixedHeight />
				</div>
			</div>
		</div>
	</div>
</div>
