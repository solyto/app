<script lang="ts">
	import type { CheckInTracker } from '$lib/types/check_in';
	import type { GoalProgress } from '$lib/services/CheckInTrackerService';
	import { goalProgressText } from '$lib/helpers/CheckInHelper';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import IconCheck from '$lib/icons/lucide/check.svelte';

	let { tracker, progress }: { tracker: CheckInTracker; progress: GoalProgress } = $props();

	const ts = getTranslation();
</script>

<div class="flex items-center gap-1 text-xs text-c-neutral-5 dark:text-c-neutral-4">
	<span>{goalProgressText(tracker, progress, ts.get.checkIn)}</span>
	{#if progress.met}
		<IconCheck class="size-3.5 text-c-success" aria-label={ts.get.checkIn.goal_met} />
	{/if}
</div>
