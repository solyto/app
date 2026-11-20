<script lang="ts">
	import type { Goal } from '$lib/types/goal';
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { getGoals } from '$lib/state/Goals.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import GoalCard from '$lib/components/goals/GoalCard.svelte';
	import GoalEditor from '$lib/components/goals/GoalEditor.svelte';
	import IconPlus from '$lib/icons/lucide/plus.svelte';

	const checkInData = getCheckInData();
	const goals = getGoals();
	const ts = getTranslation();

	let editing = $state<Goal | 'new' | null>(null);

	// Goals on trackers that were switched off stay, but only show while their tracker is on.
	const shown = $derived(
		goals.goals.flatMap((goal) => {
			const tracker = checkInData.activeTrackers.find((t) => t.id === goal.check_in_tracker_id);
			return tracker ? [{ goal, tracker }] : [];
		})
	);
</script>

<div class="flex flex-col gap-6 pt-2">
	{#if goals.loaded && checkInData.loaded}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each shown as { goal, tracker } (goal.id)}
				<GoalCard {goal} {tracker} onEdit={() => (editing = goal)} />
			{/each}
			<!-- Adding sits where the goals are; the dashed style is the one of the notes image upload. -->
			<button
				type="button"
				class="flex min-h-40 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-c-neutral-2 px-4 text-sm text-c-neutral-4 transition-colors hover:border-s-teal hover:text-s-teal dark:border-s-dark dark:hover:border-s-teal"
				onclick={() => (editing = 'new')}
			>
				<IconPlus class="size-5" />
				{ts.get.goals.new_goal}
			</button>
		</div>
	{/if}
</div>

{#if editing !== null}
	<GoalEditor goal={editing === 'new' ? null : editing} onClose={() => (editing = null)} />
{/if}
