<script lang="ts">
	import { onMount } from 'svelte';
	import { getPlanner } from '$lib/state/Planner.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getViewPoint } from '$lib/state/Viewpoint.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import PlannerDateStrip from '$lib/components/planner/PlannerDateStrip.svelte';
	import PlannerTimegrid from '$lib/components/planner/PlannerTimegrid.svelte';
	import PlannerMobileList from '$lib/components/planner/PlannerMobileList.svelte';
	import PlannerTodoColumn from '$lib/components/planner/PlannerTodoColumn.svelte';
	import PlannerDiaryWidget from '$lib/components/planner/PlannerDiaryWidget.svelte';
	import PlannerCheckInWidget from '$lib/components/planner/PlannerCheckInWidget.svelte';
	import { formatDateWithWeekday } from '$lib/helpers/DateHelper';
	import { getAuth } from '$lib/state/Auth.svelte';

	const planner = getPlanner();
	const loadingIndicator = getLoadingIndicator();
	const viewPoint = getViewPoint();
	const ts = getTranslation();
	const auth = getAuth();

	onMount(async () => {
		loadingIndicator.start();
		await planner.load();
		loadingIndicator.stop();
	});

	const dayTitle = $derived(
		formatDateWithWeekday(
			planner.selectedDay,
			auth.user?.settings?.date_format ?? null,
			auth.user?.settings?.language ?? undefined
		)
	);
</script>

<div class="flex h-full w-full flex-col gap-3 p-3 md:p-4">
	<PlannerDateStrip />

	{#if planner.loaded}
		<h2 class="text-xl font-bold text-c-heading dark:text-c-primary">{dayTitle}</h2>

		{#if viewPoint.isMobile || viewPoint.isTablet}
			<div class="min-h-0 flex-1 overflow-y-auto">
				<PlannerMobileList />
			</div>
		{:else}
			<div class="min-h-0 flex-1 gap-3 md:flex">
				<div
					class="min-h-64 flex-1 rounded-lg border-1 border-c-neutral-1 dark:border-s-dark"
				>
					<PlannerTimegrid />
				</div>
				<div class="flex w-full flex-col gap-3 md:w-72 lg:w-80">
					<PlannerTodoColumn />
					<PlannerDiaryWidget />
					<PlannerCheckInWidget />
				</div>
			</div>
		{/if}
	{:else}
		<div class="flex flex-1 items-center justify-center text-sm opacity-60">
			{ts.get.planner.no_entries}
		</div>
	{/if}
</div>
