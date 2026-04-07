<script lang="ts">
	import { getCalendars } from '$lib/state/Calendars.svelte';
	import CalendarEdit from '$lib/components/calendars/CalendarEdit.svelte';
	import IconChevronLeft from '@lucide/svelte/icons/chevron-left';
	import CalendarCreate from '$lib/components/calendars/CalendarCreate.svelte';

	let { onClose } = $props<{ onClose: () => void }>();

	const calendars = getCalendars();

	const activeCalendars = $derived([
		...calendars.ownedCalendars,
		...calendars.acceptedSharedCalendars
	]);
</script>

<div class="flex h-full w-full flex-col justify-center gap-2 p-4">
	<button
		onclick={onClose}
		class="cursor-pointer self-center rounded-full bg-c-neutral p-2 transition-all hover:bg-white dark:bg-s-dark-3 dark:hover:bg-s-dark-2"
	>
		<IconChevronLeft class="h-6 w-6" />
	</button>
	{#each activeCalendars as calendar (calendar.id)}
		<CalendarEdit {calendar} />
	{/each}
	<CalendarCreate />
</div>
