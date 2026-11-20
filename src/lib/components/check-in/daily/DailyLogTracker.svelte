<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { CheckInTracker } from '$lib/types/check_in';
	import { MAX_CHECK_IN_COUNT } from '$lib/types/check_in';
	import type { GoalProgress } from '$lib/services/CheckInTrackerService';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import TrackerGlyph from '$lib/components/check-in/TrackerGlyph.svelte';
	import GoalProgressLine from '$lib/components/check-in/daily/GoalProgressLine.svelte';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import IconCheck from '$lib/icons/lucide/check.svelte';
	import IconMinus from '$lib/icons/lucide/minus.svelte';
	import IconPlus from '$lib/icons/lucide/plus.svelte';

	let { tracker, label, value, progress = null, onSet }: {
		tracker: CheckInTracker;
		label: string;
		value: number | null;
		progress?: GoalProgress | null;
		onSet: (value: number | null) => void;
	} = $props();

	const ts = getTranslation();
	const STEP_BUTTON =
		'flex size-10 cursor-pointer items-center justify-center rounded-lg border-2 border-c-neutral-1 transition-all hover:bg-c-neutral disabled:cursor-default disabled:opacity-40 dark:border-s-dark-3 dark:hover:bg-s-dark-3';

	let panelOpen = $state<boolean>(false);
	let mode = $state<'add' | 'set'>('add');
	let amount = $state<number | null>(null);

	const total = $derived(value ?? 0);
	const result = $derived(mode === 'add' ? total + (amount ?? 0) : (amount ?? 0));
	const resultValid = $derived(amount !== null && Number.isInteger(amount) && amount >= 0 && result <= MAX_CHECK_IN_COUNT);

	function toggleDone(): void {
		onSet(value === null ? 1 : null);
	}

	function step(offset: 1 | -1): void {
		const next = Math.min(Math.max(total + offset, 0), MAX_CHECK_IN_COUNT);
		onSet(next === 0 ? null : next);
	}

	function togglePanel(): void {
		panelOpen = !panelOpen;
		mode = 'add';
	}

	function switchMode(): void {
		mode = mode === 'add' ? 'set' : 'add';
		amount = mode === 'set' ? total : null;
	}

	function apply(event: SubmitEvent): void {
		event.preventDefault();
		if (!resultValid) return;

		onSet(result === 0 ? null : result);
		panelOpen = false;
		if (mode === 'set') amount = null;
	}
</script>

<div class="flex flex-col">
	<div class="flex items-center justify-between gap-4 py-1">
		<div class="flex min-w-0 items-center gap-3">
			<span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-c-neutral text-c-heading dark:bg-s-dark-3 dark:text-c-primary">
				<TrackerGlyph {tracker} class="size-5" />
			</span>
			<div class="min-w-0">
				<div class="line-clamp-2 text-lg font-semibold break-words">{label}</div>
				{#if progress}
					<GoalProgressLine {tracker} {progress} />
				{/if}
			</div>
		</div>

		{#if tracker.type === 'yes_no'}
			<button
				type="button"
				class="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border-3 transition-all"
				class:border-c-neutral-1={value === null}
				class:dark:border-s-dark-3={value === null}
				class:hover:bg-c-neutral={value === null}
				class:border-transparent={value !== null}
				class:bg-c-primary={value !== null}
				class:text-white={value !== null}
				aria-pressed={value !== null}
				aria-label={label}
				onclick={toggleDone}
			>
				{#if value !== null}
					<IconCheck class="size-6" />
				{/if}
			</button>
		{:else}
			<div class="flex shrink-0 items-center gap-1">
				<button type="button" class={STEP_BUTTON} disabled={total === 0} aria-label={ts.get.checkIn.count_decrease} onclick={() => step(-1)}>
					<IconMinus class="size-4" />
				</button>
				<button
					type="button"
					class="h-10 min-w-14 cursor-pointer rounded-lg px-2 text-lg font-bold tabular-nums transition-all hover:bg-c-neutral dark:hover:bg-s-dark-3"
					aria-expanded={panelOpen}
					title={ts.get.checkIn.count_add_amount}
					onclick={togglePanel}
				>
					{total}
				</button>
				<button type="button" class={STEP_BUTTON} disabled={total >= MAX_CHECK_IN_COUNT} aria-label={ts.get.checkIn.count_increase} onclick={() => step(1)}>
					<IconPlus class="size-4" />
				</button>
			</div>
		{/if}
	</div>

	{#if panelOpen}
		<form class="mt-1 mb-2 flex flex-wrap items-center justify-end gap-2 rounded-lg bg-c-neutral p-2 text-sm dark:bg-s-dark-3" onsubmit={apply} transition:slide={{ duration: 150 }}>
			<span>{mode === 'add' ? ts.get.checkIn.count_add_amount : ts.get.checkIn.count_set_total}</span>
			<div class="w-24">
				<NumberInput bind:value={amount} min={0} max={MAX_CHECK_IN_COUNT} step={1} />
			</div>
			{#if mode === 'add' && resultValid}
				<span class="tabular-nums text-c-neutral-5 dark:text-c-neutral-4">{total} → {result}</span>
			{/if}
			<TextButton title={mode === 'add' ? ts.get.checkIn.count_add : ts.get.checkIn.count_set} type="primary" disabled={!resultValid} />
			<button type="button" class="w-full cursor-pointer text-right text-xs text-c-neutral-5 underline dark:text-c-neutral-4" onclick={switchMode}>
				{mode === 'add' ? ts.get.checkIn.count_set_total : ts.get.checkIn.count_add_amount}
			</button>
		</form>
	{/if}
</div>
