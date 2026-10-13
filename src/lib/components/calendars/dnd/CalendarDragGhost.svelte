<script lang="ts">
	import { calendarDrag } from './CalendarDragState.svelte';
	import { getEventBackgroundColor, getEventBorderColor } from '$lib/helpers/ColorHelper';

	function isGhostVisible(): boolean {
		return calendarDrag.active && calendarDrag.event !== null && calendarDrag.ghost !== null;
	}

	function ghostStyle(): string {
		const { ghost, event } = calendarDrag;
		if (!ghost || !event) return '';

		return [
			`left: ${ghost.x}px`,
			`top: ${ghost.y}px`,
			`width: ${ghost.width}px`,
			`height: ${ghost.height}px`,
			`border-color: ${getEventBorderColor(event.calendar_color)}`,
			`background-color: ${getEventBackgroundColor(event.calendar_color)}`
		].join('; ');
	}
</script>

{#if isGhostVisible()}
	<div
		class="pointer-events-none fixed z-[100] flex items-start justify-start border-l-4 px-2 py-1 pl-2 text-sm shadow-lg select-none"
		style={ghostStyle()}
	>
		<span class="truncate text-left">{calendarDrag.event?.title}</span>
	</div>
{/if}
