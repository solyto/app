<script lang="ts">
	import IconChevronLeft from '@lucide/svelte/icons/chevron-left';
	import IconChevronRight from '@lucide/svelte/icons/chevron-right';
	import { getPlanner } from '$lib/state/Planner.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getUrlFormat } from '$lib/helpers/DateHelper';
	import { isDateToday } from '$lib/helpers/DateHelper';
	import { getAuth } from '$lib/state/Auth.svelte';

	const planner = getPlanner();
	const ts = getTranslation();
	const auth = getAuth();

	const language = $derived(auth.user?.settings?.language ?? undefined);

	function isSelected(day: Date): boolean {
		return getUrlFormat(day) === getUrlFormat(planner.selectedDay);
	}

	function weekdayLabel(day: Date): string {
		return day.toLocaleDateString(language, { weekday: 'short' });
	}
</script>

<div class="flex w-full flex-col gap-1">
	<div class="flex items-center justify-between">
		<button
			class="cursor-pointer rounded-lg p-2 transition-all hover:bg-c-neutral dark:hover:bg-s-dark-3"
			onclick={() => planner.lastStrip()}
			aria-label={ts.get.planner.title}
		>
			<IconChevronLeft class="size-5" />
		</button>
		<button
			class="cursor-pointer rounded-lg px-2 py-1 text-sm font-bold text-c-action transition-all hover:bg-c-neutral dark:hover:bg-s-dark-3"
			onclick={() => planner.goToToday()}
		>
			{ts.get.planner.today}
		</button>
		<button
			class="cursor-pointer rounded-lg p-2 transition-all hover:bg-c-neutral dark:hover:bg-s-dark-3"
			onclick={() => planner.nextStrip()}
			aria-label={ts.get.planner.title}
		>
			<IconChevronRight class="size-5" />
		</button>
	</div>

	<div class="flex w-full items-center justify-between gap-1">
		{#each planner.days as day (getUrlFormat(day))}
			<button
				class="flex min-w-12 flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-all hover:bg-c-neutral dark:hover:bg-s-dark-3"
				class:bg-c-primary={isSelected(day)}
				class:text-white={isSelected(day)}
				class:outline-1={isDateToday(day) && !isSelected(day)}
				class:outline={isDateToday(day) && !isSelected(day)}
				class:outline-c-action={isDateToday(day) && !isSelected(day)}
				onclick={() => planner.selectDay(day)}
			>
				<span class="text-xs opacity-70">{weekdayLabel(day)}</span>
				<span class="text-base leading-tight font-bold">{day.getDate()}</span>
			</button>
		{/each}
	</div>
</div>
