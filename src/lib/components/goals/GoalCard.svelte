<script lang="ts">
	import type { Goal } from '$lib/types/goal';
	import type { CheckInTracker } from '$lib/types/check_in';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { goalProgressParts, trackerLabel } from '$lib/helpers/CheckInHelper';
	import GoalService from '$lib/services/GoalService';
	import { parseUrlFormat } from '$lib/helpers/DateHelper';
	import TrackerGlyph from '$lib/components/check-in/TrackerGlyph.svelte';
	import IconCheck from '$lib/icons/lucide/check.svelte';
	import GoalBar from '$lib/components/goals/GoalBar.svelte';
	import EditButton from '$lib/components/ui/buttons/EditButton.svelte';

	let { goal, tracker, onEdit }: { goal: Goal; tracker: CheckInTracker; onEdit: () => void } = $props();

	const ts = getTranslation();
	const auth = getAuth();
	const goalService = new GoalService();

	const daysLeft = $derived(goalService.daysLeft(goal, new Date()));
	const parts = $derived(goalProgressParts(goal, tracker, goal.progress, ts.get.checkIn));
	// Oldest first, so the row reads towards the running period.
	const history = $derived([...goal.progress.history].reverse());
	const metCount = $derived(history.filter((period) => period.met).length);

	function periodLabel(start: string): string {
		return goal.period === 'month'
			? parseUrlFormat(start)!.toLocaleDateString(undefined, { month: 'short' })
			: auth.getDateWithoutYearInUserPreferredFormat(start);
	}

	function historySummary(): string {
		const template = { day: ts.get.goals.history_summary_day, week: ts.get.goals.history_summary_week, month: ts.get.goals.history_summary_month }[goal.period];
		return template.replace('{met}', String(metCount)).replace('{n}', String(history.length));
	}
</script>

<div class="flex flex-col gap-4 rounded-lg bg-c-bg-surface p-4 shadow-sm">
	<div class="flex items-center gap-2">
		<TrackerGlyph {tracker} class="size-4 shrink-0 text-c-neutral-4 dark:text-c-neutral-5" />
		<span class="min-w-0 flex-1 truncate">{trackerLabel(tracker, ts.get.checkIn)}</span>
		<EditButton title={ts.get.goals.edit_goal} onClick={onEdit} inModal={false} buttonStyle="fill-on-hover" />
	</div>

	<div class="flex flex-col gap-2">
		<div>
			<div class="flex items-center gap-2">
				<span class="text-3xl font-bold tabular-nums">{parts.value}</span>
				{#if goal.progress.met}
					<IconCheck class="size-6 text-c-success" aria-label={ts.get.checkIn.goal_met} />
				{/if}
			</div>
			<span class="text-sm text-c-neutral-5 dark:text-c-neutral-4">
				{parts.period}{#if daysLeft !== null}
					· {daysLeft === 1 ? ts.get.goals.last_day : ts.get.goals.days_left.replace('{n}', String(daysLeft))}{/if}
			</span>
		</div>
		<GoalBar {goal} {tracker} size="md" />
	</div>

	{#if history.length > 0}
		<div class="flex flex-col gap-2">
			<span class="text-sm text-c-neutral-5 dark:text-c-neutral-4">{historySummary()}</span>
			<div class="grid grid-cols-6 gap-1">
				{#each history as period (period.period_start)}
					<div class="flex flex-col items-center gap-1" title={period.met ? ts.get.goals.history_met : ts.get.goals.history_missed}>
						<span
							class="h-2 w-full rounded-full"
							class:bg-c-success={period.met}
							class:bg-c-neutral-2={!period.met}
							class:dark:bg-s-dark-3={!period.met}
						></span>
						<span class="text-xs text-c-neutral-4 tabular-nums dark:text-c-neutral-5">{periodLabel(period.period_start)}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
