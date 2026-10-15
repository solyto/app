<script lang="ts">
	import type {
		FinanceValue,
		FinanceValueForm,
		StoreFinanceValueRequest,
		UpdateFinanceValueRequest
	} from '$lib/types/finance';
	import FinanceHistoryService from '$lib/services/FinanceHistoryService';
	import { formatDate, getUrlFormat } from '$lib/helpers/DateHelper';
	import { europeanFormat } from '$lib/helpers/NumberHelper';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import DateInput from '$lib/components/forms/DateInput.svelte';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import InlineEditButton from '$lib/components/ui/buttons/InlineEditButton.svelte';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import SmoothLineChart from '$lib/components/charts/SmoothLineChart.svelte';

	const ts = getTranslation();
	const history = new FinanceHistoryService();
	const HINT = 'text-sm text-c-neutral-5';

	let {
		values,
		minValues = 0,
		onAdd,
		onUpdate,
		onDelete
	} = $props<{
		values: FinanceValue[];
		minValues?: number;
		onAdd: (request: StoreFinanceValueRequest) => Promise<boolean>;
		onUpdate: (value: FinanceValue, request: UpdateFinanceValueRequest) => Promise<boolean>;
		onDelete: (value: FinanceValue) => Promise<boolean>;
	}>();

	let today = getUrlFormat(new Date());
	let addForm = $state<FinanceValueForm>(history.emptyForm(new Date()));
	let editingId = $state<number | null>(null);
	let editForm = $state<FinanceValueForm>(history.emptyForm(new Date()));
	let deleteCandidate = $state<FinanceValue | null>(null);

	function replacesHint(): string | null {
		const replaced = history.findByDate(values, addForm.date);
		return replaced ? ts.get.finances.replaces_value.replace('%s', europeanFormat(replaced.value)) : null;
	}

	function isEditDateTaken(): boolean {
		return editingId !== null && history.findOtherByDate(values, editForm.date, editingId) !== null;
	}

	function canSaveEdit(): boolean {
		return history.toRequest(editForm) !== null && !isEditDateTaken();
	}

	async function add(): Promise<void> {
		const request = history.toRequest(addForm);
		if (request === null) return;
		if (await onAdd(request)) addForm = history.emptyForm(new Date());
	}

	function startEdit(value: FinanceValue): void {
		editForm = history.toForm(value);
		editingId = value.id;
	}

	function cancelEdit(): void {
		editingId = null;
	}

	async function saveEdit(value: FinanceValue): Promise<void> {
		const request = history.toRequest(editForm);
		if (request === null || isEditDateTaken()) return;
		if (await onUpdate(value, request)) editingId = null;
	}

	function askDelete(value: FinanceValue): void {
		deleteCandidate = value;
	}

	function cancelDelete(): void {
		deleteCandidate = null;
	}

	async function confirmDelete(): Promise<void> {
		if (deleteCandidate === null) return;
		const value = deleteCandidate;
		deleteCandidate = null;
		await onDelete(value);
	}
</script>

<div class="flex w-full flex-col gap-6 md:w-2xl">
	{#if values.length > 1}
		<SmoothLineChart
			categories={history.chartCategories(values)}
			values={history.chartValues(values)}
			filled={true}
			class="h-56"
		/>
	{/if}
	<div class="flex flex-col gap-2">
		<div class="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
			<DateInput bind:value={addForm.date} max={today} />
			<NumberInput bind:value={addForm.value} placeholder={ts.get.finances.amount} />
			<TextButton title={ts.get.finances.add_entry} type="action" onclick={add} disabled={history.toRequest(addForm) === null} />
		</div>
		{#if replacesHint()}
			<p class={HINT}>{replacesHint()}</p>
		{/if}
	</div>
	{#if values.length === 0}
		<p class={HINT}>{ts.get.finances.no_values}</p>
	{:else}
		<ul class="flex flex-col gap-1">
			{#each history.sortNewestFirst(values) as value (value.id)}
				<li class="flex min-h-10 flex-col gap-1">
					{#if editingId === value.id}
						<div class="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2">
							<DateInput bind:value={editForm.date} max={today} />
							<NumberInput bind:value={editForm.value} placeholder={ts.get.finances.amount} />
							<TextButton title={ts.get.layout.modal_cancel} type="plain" onclick={cancelEdit} />
							<TextButton title={ts.get.layout.save} type="primary" onclick={() => saveEdit(value)} disabled={!canSaveEdit()} />
						</div>
						{#if isEditDateTaken()}
							<p class={HINT}>{ts.get.finances.date_taken}</p>
						{/if}
					{:else}
						<div class="flex items-center gap-4">
							<span class="flex-1">{formatDate(history.toLocalDate(value))}</span>
							<span>{europeanFormat(value.value)}</span>
							<InlineEditButton onClick={() => startEdit(value)} label={ts.get.finances.edit_value} />
							{#if values.length > minValues}
								<InlineDeleteButton onClick={() => askDelete(value)} label={ts.get.finances.delete_value_label} />
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
{#if deleteCandidate}
	<ConfirmationModal
		title={ts.get.finances.delete_value_label}
		description={ts.get.finances.delete_value_message}
		type="confirm-delete"
		onConfirm={confirmDelete}
		onCancel={cancelDelete}
	/>
{/if}
