<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getFinances } from '$lib/state/Finances.svelte';
	import AddWealthField from '$lib/components/finances/AddWealthField.svelte';
	import WealthFieldDisplay from '$lib/components/finances/WealthField.svelte';
	import type {
		WealthField,
		FinanceValue,
		StoreFinanceValueRequest,
		UpdateFinanceValueRequest
	} from '$lib/types/finance';
	import { europeanFormat } from '$lib/helpers/NumberHelper';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import DoughnutChart from '$lib/components/charts/DoughnutChart.svelte';
	import { onMount } from 'svelte';
	import WealthStatisticsService from '$lib/services/WealthStatisticsService';
	import StackedAreaChart from '$lib/components/charts/StackedAreaChart.svelte';
	import SmoothLineChart from '$lib/components/charts/SmoothLineChart.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import FinanceHistory from '$lib/components/finances/FinanceHistory.svelte';

	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const finances = getFinances();
	const statisticsService = new WealthStatisticsService();

	let statistics = $state<{ date: string; values: { field: string; value: number }[] }[]>([]);
	let showHistory = $state<boolean>(false);
	let historyFieldId = $state<number | null>(null);
	let historyField = $derived(finances.wealth.find((field) => field.id === historyFieldId) ?? null);

	function openHistory(wealth: WealthField): void {
		historyFieldId = wealth.id;
	}

	function closeHistory(): void {
		historyFieldId = null;
	}

	async function addHistoryValue(request: StoreFinanceValueRequest): Promise<boolean> {
		if (historyField === null) return false;
		loadingIndicator.start();
		const ok = await finances.addWealthValue(historyField, request);
		loadingIndicator.stop();
		return ok;
	}

	async function updateHistoryValue(value: FinanceValue, request: UpdateFinanceValueRequest): Promise<boolean> {
		if (historyField === null) return false;
		loadingIndicator.start();
		const ok = await finances.updateWealthValue(historyField, value, request);
		loadingIndicator.stop();
		return ok;
	}

	async function deleteHistoryValue(value: FinanceValue): Promise<boolean> {
		if (historyField === null) return false;
		loadingIndicator.start();
		const ok = await finances.deleteWealthValue(historyField, value);
		loadingIndicator.stop();
		return ok;
	}

	function getSeriesData(stats: typeof statistics) {
		if (stats.length === 0) return [];

		return finances.wealth.map((field) => {
			return {
				title: field.title,
				values: stats.map((stat) => {
					const found = stat.values.find((v) => v.field === field.title);
					return found ? found.value : 0;
				})
			};
		});
	}

	function getTotalSeriesData(stats: typeof statistics) {
		if (stats.length === 0) return [];

		return stats.map((stat) => {
			return stat.values.reduce((sum, v) => sum + v.value, 0);
		});
	}

	onMount(() => {
		statisticsService.setData(finances.wealth);

		statistics = statisticsService.getGraphValues() as unknown as {
			date: string;
			values: { field: string; value: number }[];
		}[];
	});
</script>

{#if finances.wealthLoaded}
	<TextButton
		title={showHistory ? ts.get.finances.hide_history : ts.get.finances.show_history}
		onclick={() => {
			showHistory = !showHistory;
		}}
		class="absolute top-6 right-6 z-40"
	/>
	<div class="flex flex-col gap-4" in:fade>
		<div class="mb-8 w-full">
			<DoughnutChart
				title=""
				values={finances.wealth.map((wealth) => ({
					value: wealth.currentValue?.value ?? 0,
					name: wealth.title
				}))}
			/>
		</div>
		<div
			class="relative w-full rounded-md p-4 shadow-sm dark:shadow-s-dark-shadow md:dark:bg-s-dark-2"
		>
			<div class="flex w-full flex-row items-center justify-between">
				<h2 class="text-2xl font-semibold">{ts.get.finances.total}</h2>
				<span class="text-xl tabular-nums md:text-3xl">{europeanFormat(finances.getWealthSum())}</span>
			</div>
			{#if showHistory}
				<div class="mt-8 flex w-full flex-col items-center justify-center">
					<Divider width="95%" />
					<div class="w-full" transition:slide>
						<SmoothLineChart
							categories={statistics.map((stat) => stat.date)}
							values={getTotalSeriesData(statistics)}
							min={statisticsService.getTrendMin(getTotalSeriesData(statistics))}
							filled={true}
						/>
					</div>
				</div>
			{/if}
		</div>
		<div
			class="relative w-full rounded-md p-4 shadow-sm dark:shadow-s-dark-shadow md:dark:bg-s-dark-2"
		>
			<div class="mb-4 flex w-full flex-row items-center justify-between">
				<h2 class="text-2xl font-semibold">{ts.get.finances.positions}</h2>
				<AddWealthField />
			</div>
			<div class="flex flex-col gap-1">
				{#each finances.wealth as wealth (wealth.id)}
					<WealthFieldDisplay {wealth} sectionTotal={finances.getWealthSum()} onOpenHistory={openHistory} />
				{/each}
			</div>
			{#if showHistory}
				<div class="mt-8 flex w-full flex-col items-center justify-center">
					<Divider width="95%" />
					<div class="w-full" transition:slide>
						<StackedAreaChart
							xCategories={statistics.map((stat) => stat.date)}
							dataPoints={getSeriesData(statistics)}
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
{#if historyField}
	<ContentModal title={historyField.title} showTitleOnMobile={true} rounded="2xl" onClose={closeHistory}>
		<FinanceHistory
			values={historyField.values}
			onAdd={addHistoryValue}
			onUpdate={updateHistoryValue}
			onDelete={deleteHistoryValue}
		/>
	</ContentModal>
{/if}
