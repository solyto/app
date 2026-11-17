<script lang="ts">
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import { onDestroy, tick } from 'svelte';
	import { getFinances } from '$lib/state/Finances.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getKeyManager } from '$lib/state/KeyManager.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import type { BudgetInterval, BudgetType, CreateBudgetRequest } from '$lib/types/finance';
	import AddButton from '$lib/components/ui/buttons/AddButton.svelte';
	import { getViewPoint } from '$lib/state/Viewpoint.svelte';
	import BottomSheetModal from '$lib/components/ui/BottomSheetModal.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import SegmentedControl from '$lib/components/forms/SegmentedControl.svelte';
	import type { MultiSelectEntry } from '$lib/components/forms/MultiSelect.svelte';
	import BudgetTagPicker from '$lib/components/finances/BudgetTagPicker.svelte';

	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const keyManager = getKeyManager();
	const finances = getFinances();
	const viewPoint = getViewPoint();

	let { type, showTags }: { type: BudgetType; showTags: boolean } = $props();

	let formOpen = $state<boolean>(false);
	let titleInput = $state<HTMLInputElement | null>(null);
	let titleValue = $state<string>('');
	let valueInput = $state<HTMLInputElement | null>(null);
	let valueValue = $state<number | null>(null);
	let intervalValue = $state<BudgetInterval>('monthly');
	let selectedTags = $state<MultiSelectEntry[]>([]);
	let keyHandlers: { [key: string]: string | null } = { Enter: null, Escape: null };

	async function toggleForm() {
		formOpen = !formOpen;

		if (formOpen) {
			await tick();
			titleInput?.focus();

			keyHandlers.Enter = keyManager.registerKeyDown('Enter', handleEnter);
			keyHandlers.Escape = keyManager.registerKeyDown('Escape', handleEscape);
		}
	}

	onDestroy(() => keyManager.unregisterAll(keyHandlers));

	function onblur(): void {
		formOpen = false;
		keyManager.unregisterAll(keyHandlers);
	}

	async function onSubmit(): Promise<void> {
		loadingIndicator.start();

		if (titleValue.trim() !== '' && valueValue !== null) {
			const request: CreateBudgetRequest = {
				type: type,
				title: titleValue.trim(),
				value: valueValue,
				interval: intervalValue,
				tags: selectedTags.length > 0 ? selectedTags.filter((tag) => tag.value).map((tag) => Number(tag.value)) : undefined
			};
			const res = await finances.addBudget(request);
			if (res) {
				titleValue = '';
				valueValue = null;
				intervalValue = 'monthly';
				selectedTags = [];
				await toggleForm();
				loadingIndicator.stop();
				keyManager.unregisterKeyDown(keyHandlers.Enter);
			}
		}
	}

	async function handleEnter(event: KeyboardEvent): Promise<void> {
		await onSubmit();
	}

	function handleEscape(event: KeyboardEvent): void {
		onblur();
	}
</script>

<div class="flex justify-start">
	{#if formOpen}
		{#if viewPoint.isDesktop}
			<div class="flex flex-row items-center gap-2">
				<TextInput placeholder="Title" bind:input={titleInput} bind:value={titleValue} />
				<NumberInput placeholder="Value" bind:input={valueInput} bind:value={valueValue} />
				<SegmentedControl bind:value={intervalValue} options={finances.budgetIntervals.options(ts.get.finances)} />
				{#if showTags}
					<div class="w-48">
						<BudgetTagPicker bind:value={selectedTags} />
					</div>
				{/if}
			</div>
		{:else}
			<BottomSheetModal title={ts.get.finances.add_entry} onClose={onblur}>
				<div class="flex flex-row gap-2">
					<TextInput placeholder="Title" bind:input={titleInput} bind:value={titleValue} />
					<NumberInput placeholder="Value" bind:input={valueInput} bind:value={valueValue} />
				</div>
				<div class="mt-4">
					<SegmentedControl bind:value={intervalValue} options={finances.budgetIntervals.options(ts.get.finances)} />
				</div>
				{#if showTags}
					<div class="mt-4">
						<BudgetTagPicker bind:value={selectedTags} />
					</div>
				{/if}
				<TextButton title={ts.get.layout.modal_confirm} type="action" onclick={onSubmit} class="mt-8 w-full" />
			</BottomSheetModal>
		{/if}
	{/if}
	{#if viewPoint.isMobile || !formOpen}
		<AddButton
			colorOnHover={true}
			hoverColor={type === 'income' ? 'success' : 'danger'}
			onClick={toggleForm}
		/>
	{/if}
</div>
