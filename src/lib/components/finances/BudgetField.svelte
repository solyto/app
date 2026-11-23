<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Budget } from '$lib/types/finance';
	import { europeanFormat } from '$lib/helpers/NumberHelper.js';
	import IconTrash from '$lib/icons/lucide/trash.svelte';
	import IconPen from '$lib/icons/lucide/pen.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getFinances } from '$lib/state/Finances.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import TagFlexList from '$lib/components/tags/TagFlexList.svelte';

	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const finances = getFinances();
	const budgetIntervals = finances.budgetIntervals;

	let { budget, sectionTotal, onOpenHistory }: {
		budget: Budget;
		sectionTotal: number;
		onOpenHistory: (budget: Budget) => void | Promise<void>;
	} = $props();

	let confirmingDelete = $state<boolean>(false);

	function openHistory(event: MouseEvent): void {
		event.stopPropagation();
		onOpenHistory(budget);
	}

	function askDelete(event: MouseEvent): void {
		event.stopPropagation();
		confirmingDelete = true;
	}

	async function confirmDelete(): Promise<void> {
		confirmingDelete = false;
		loadingIndicator.start();
		await finances.deleteBudget(budget);
		loadingIndicator.stop();
	}

	function deleteLabel(): string {
		return ts.get.finances.delete_item.replace('%s', budget.title);
	}

	function getShare(): number {
		if (sectionTotal <= 0) return 0;
		return (budgetIntervals.monthlyAmount(budget) / sectionTotal) * 100;
	}
</script>

<div
	class="group -mx-2 flex cursor-pointer flex-col rounded-md px-2 py-1 transition-all hover:bg-c-neutral-1 dark:hover:bg-s-dark-3"
	onclick={() => onOpenHistory(budget)}
>
	<div class="flex w-full flex-row items-center justify-between">
		<div class="flex min-w-0 flex-wrap items-center gap-2">
			<div class="text-lg">{budget.title}</div>
			{#if budget.tags.length > 0}
				<TagFlexList tags={budget.tags} />
			{/if}
		</div>
		<div class="flex items-center gap-4">
			<div class="hidden items-center gap-2 transition-all md:flex md:opacity-0 md:group-hover:opacity-100">
				<button class="cursor-pointer" onclick={openHistory}>
					<IconPen class="size-5 text-c-neutral-3 transition-all hover:text-c-action" />
				</button>
				<button class="cursor-pointer" aria-label={deleteLabel()} onclick={askDelete}>
					<IconTrash class="size-5 text-c-neutral-3 transition-all hover:text-c-danger" />
				</button>
			</div>
			<!-- Left of the amount, so the monthly amounts stay in one right-aligned column. -->
			{#if budgetIntervals.intervalOf(budget) !== 'monthly'}
				<span class="hidden text-sm text-c-neutral-5 tabular-nums md:inline">
					{europeanFormat(budget.value)} {budgetIntervals.suffix(budget, ts.get.finances)}
				</span>
			{/if}
			<div class="text-lg tabular-nums">
				{budget.type === 'income' ? '+ ' : '- '}{europeanFormat(budgetIntervals.monthlyAmount(budget))}
			</div>
		</div>
	</div>
	<div
		class="mt-0.5 h-1 rounded-full bg-c-neutral-2 dark:bg-s-dark-3"
		style="width: {getShare()}%"
		in:slide|global={{ axis: 'x' }}
	></div>
</div>
{#if confirmingDelete}
	<ConfirmationModal
		title={deleteLabel()}
		description={ts.get.finances.delete_item_message.replace('%s', budget.title)}
		type="confirm-delete"
		onConfirm={confirmDelete}
		onCancel={() => (confirmingDelete = false)}
	/>
{/if}
