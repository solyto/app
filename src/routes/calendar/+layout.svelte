<script lang="ts">
	import { setCalendars } from '$lib/state/Calendars.svelte';
	import { setCalendarDrag } from '$lib/state/CalendarDrag.svelte';
	import { setTodos } from '$lib/state/Todos.svelte';

	setCalendars();
	setCalendarDrag();
	setTodos();

	let { children } = $props();
</script>

{@render children?.()}
