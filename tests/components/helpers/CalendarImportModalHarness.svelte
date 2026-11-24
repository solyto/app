<script lang="ts">
	import { onDestroy } from 'svelte';
	import ImportModal from '$lib/components/calendars/ImportModal.svelte';
	import { setCalendars } from '$lib/state/Calendars.svelte';
	import { setCalendarImport, type CalendarImport } from '$lib/state/CalendarImport.svelte';
	import type { Calendar, ImportState } from '$lib/types/calendar';

	let { calendars = [], state = null, onStore }: {
		calendars?: Calendar[];
		state?: ImportState | null;
		onStore?: (store: CalendarImport) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	setCalendars().calendars = calendars;
	const calendarImport = setCalendarImport();
	// svelte-ignore state_referenced_locally
	calendarImport.state = state;
	calendarImport.importModal = true;
	// svelte-ignore state_referenced_locally
	onStore?.(calendarImport);

	onDestroy(() => calendarImport.destroy());
</script>

<ImportModal />
