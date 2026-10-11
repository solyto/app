<script lang="ts">
	import IconNotebookPen from '@lucide/svelte/icons/notebook-pen';
	import { getPlanner } from '$lib/state/Planner.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { urls } from '$lib/config/urls';
	import { resolve } from '$app/paths';
	import { getUrlFormat } from '$lib/helpers/DateHelper';

	// Small widget: links into the day's journal entry (opens/creates via the
	// journal's own page). Journal content stays owned by the journal feature.
	const planner = getPlanner();
	const ts = getTranslation();

	const journalHref = $derived(
		resolve(urls.journalDate, { date: getUrlFormat(planner.selectedDay) })
	);
</script>

<a
	href={journalHref}
	class="flex w-full cursor-pointer items-center gap-2 rounded-lg border-1 border-c-neutral-1 p-3 transition-all hover:bg-c-neutral dark:border-s-dark dark:hover:bg-s-dark-3"
>
	<IconNotebookPen class="size-4 text-c-action" />
	<span class="text-sm font-semibold">{ts.get.planner.journal}</span>
</a>
