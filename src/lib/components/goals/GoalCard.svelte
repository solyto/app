<script lang="ts">
	import type { Goal } from '$lib/types/goal';
	import type { CheckInTracker } from '$lib/types/check_in';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { goalProgressText, trackerLabel } from '$lib/helpers/CheckInHelper';
	import GoalService from '$lib/services/GoalService';
	import TrackerGlyph from '$lib/components/check-in/TrackerGlyph.svelte';
	import IconCheck from '$lib/icons/lucide/check.svelte';
	import IconPencil from '$lib/icons/lucide/pencil.svelte';

	let { goal, tracker, onEdit }: { goal: Goal; tracker: CheckInTracker; onEdit: () => void } = $props();

	const ts = getTranslation();
	const auth = getAuth();
	const goalService = new GoalService();

	const daysLeft = $derived(goalService.daysLeft(goal, new Date()));
	// Oldest first, so the row reads towards the running period.
	const history = $derived([...goal.progress.history].reverse());

	function historyLabel(period: { period_start: string; met: boolean }): string {
		return `${auth.getDateWithoutYearInUserPreferredFormat(period.period_start)}: ${period.met ? ts.get.goals.history_met : ts.get.goals.history_missed}`;
	}
</script>

<div class="flex flex-col gap-3 rounded-xl bg-c-bg-surface p-4 shadow-sm">
	<div class="flex items-center gap-2">
		<TrackerGlyph {tracker} class="size-5 shrink-0 text-c-heading dark:text-c-primary" />
		<span class="min-w-0 flex-1 truncate font-semibold">{trackerLabel(tracker, ts.get.checkIn)}</span>
		<button
			type="button"
			class="flex size-7 cursor-pointer items-center justify-center rounded-md text-c-neutral-5 transition-all hover:bg-c-neutral dark:hover:bg-s-dark-3"
			aria-label={ts.get.goals.edit_goal}
			title={ts.get.goals.edit_goal}
			onclick={onEdit}
		>
			<IconPencil class="size-4" />
		</button>
	</div>

	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between gap-2 text-sm">
			<span class="flex items-center gap-1">
				{goalProgressText(goal, tracker, goal.progress, ts.get.checkIn)}
				{#if goal.progress.met}
					<IconCheck class="size-4 text-c-success" aria-label={ts.get.checkIn.goal_met} />
				{/if}
			</span>
			{#if daysLeft !== null}
				<span class="text-xs text-c-neutral-5 dark:text-c-neutral-4">
					{daysLeft === 1 ? ts.get.goals.last_day : ts.get.goals.days_left.replace('{n}', String(daysLeft))}
				</span>
			{/if}
		</div>
		<div class="h-1.5 overflow-hidden rounded-full bg-c-neutral-1 dark:bg-s-dark-3">
			<div
				class="h-full rounded-full transition-all duration-300"
				class:bg-c-success={goal.progress.met}
				class:bg-c-primary={!goal.progress.met}
				style="width: {goalService.ratio(goal) * 100}%"
			></div>
		</div>
	</div>

	<div class="flex items-center gap-2">
		<span class="text-xs text-c-neutral-5 dark:text-c-neutral-4">{ts.get.goals.history}</span>
		<div class="flex items-center gap-1.5">
			{#each history as period (period.period_start)}
				<span
					class="size-2.5 rounded-full"
					class:bg-c-success={period.met}
					class:bg-c-neutral-2={!period.met}
					class:dark:bg-s-dark-3={!period.met}
					title={historyLabel(period)}
					aria-label={historyLabel(period)}
					role="img"
				></span>
			{/each}
		</div>
	</div>
</div>
