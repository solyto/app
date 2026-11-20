<script lang="ts">
	import type { Goal } from '$lib/types/goal';
	import { onMount } from 'svelte';
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { getGoals } from '$lib/state/Goals.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import GoalCard from '$lib/components/goals/GoalCard.svelte';
	import GoalEditor from '$lib/components/goals/GoalEditor.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';

	const checkInData = getCheckInData();
	const goals = getGoals();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();

	let editing = $state<Goal | 'new' | null>(null);
	let loaded = $state<boolean>(false);

	// Goals on trackers that were switched off stay, but only show while their tracker is on.
	const shown = $derived(
		goals.goals.flatMap((goal) => {
			const tracker = checkInData.activeTrackers.find((t) => t.id === goal.check_in_tracker_id);
			return tracker ? [{ goal, tracker }] : [];
		})
	);

	onMount(async () => {
		loadingIndicator.start();
		await Promise.all([checkInData.loadTrackers(), goals.load()]);
		loadingIndicator.stop();
		loaded = true;
	});
</script>

<div class="flex items-center gap-4 p-4 pt-0">
	<h1 class="text-2xl font-bold">{ts.get.nav.goals}</h1>
	<TextButton title={ts.get.goals.new_goal} class="ml-auto px-3" onclick={() => (editing = 'new')} />
</div>

{#if loaded}
	{#if shown.length === 0}
		<p class="px-4 text-sm text-c-neutral-5 dark:text-c-neutral-4">{ts.get.goals.empty}</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 2xl:grid-cols-3">
			{#each shown as { goal, tracker } (goal.id)}
				<GoalCard {goal} {tracker} onEdit={() => (editing = goal)} />
			{/each}
		</div>
	{/if}
{/if}

{#if editing !== null}
	<GoalEditor goal={editing === 'new' ? null : editing} onClose={() => (editing = null)} />
{/if}
