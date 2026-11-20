<script lang="ts">
	import type { CheckInAlert, CheckInTracker } from '$lib/types/check_in';
	import { MAX_CHECK_IN_COUNT } from '$lib/types/check_in';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import TimePicker from '$lib/components/forms/TimePicker.svelte';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import IconX from '$lib/icons/lucide/x.svelte';

	let { tracker, alert, onChange, onDelete }: {
		tracker: CheckInTracker;
		alert: CheckInAlert;
		onChange: (time: string, target: number | null) => void;
		onDelete: () => void;
	} = $props();

	const ts = getTranslation();

	let hours = $state<number>(Number(alert.time.slice(0, 2)));
	let minutes = $state<number>(Number(alert.time.slice(3, 5)));
	let target = $state<number | null>(alert.target);

	function time(): string {
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
	}

	function save(): void {
		if (tracker.type === 'count' && (target === null || !Number.isInteger(target) || target < 1 || target > MAX_CHECK_IN_COUNT)) {
			target = alert.target;
			return;
		}
		onChange(time(), tracker.type === 'count' ? target : null);
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	<div class="w-32"><TimePicker bind:hours bind:minutes oninput={save} /></div>
	{#if tracker.type === 'count'}
		<span class="text-sm">{ts.get.checkIn.reminder_if_below}</span>
		<div class="w-20"><NumberInput bind:value={target} min={1} max={MAX_CHECK_IN_COUNT} step={1} onblur={save} /></div>
	{/if}
	<button
		type="button"
		class="flex size-8 cursor-pointer items-center justify-center rounded-lg text-c-neutral-5 transition-all hover:bg-c-neutral hover:text-c-danger dark:hover:bg-s-dark-3"
		aria-label={ts.get.layout.remove}
		title={ts.get.layout.remove}
		onclick={onDelete}
	>
		<IconX class="size-4" />
	</button>
</div>
