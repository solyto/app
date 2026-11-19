<script lang="ts">
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import TrendChart from '$lib/components/check-in/stats/TrendChart.svelte';
	import type { CheckIn, CheckInType } from '$lib/types/check_in';
	import { onMount } from 'svelte';
	import { getUrlFormat } from '$lib/helpers/DateHelper';
	import { getAuth } from '$lib/state/Auth.svelte';
	import IconSmile from '$lib/icons/lucide/face-slightly-smiling.svelte';
	import IconBedSingle from '$lib/icons/lucide/bed-single.svelte';
	import IconSparkles from '$lib/icons/lucide/sparkles.svelte';
	import IconBriefcaseBusiness from '$lib/icons/lucide/briefcase-business.svelte';
	import IconApple from '$lib/icons/lucide/apple.svelte';
	import IconPizza from '$lib/icons/lucide/pizza.svelte';
	import IconDroplets from '$lib/icons/lucide/droplets.svelte';
	import IconDroplet from '$lib/icons/lucide/droplet.svelte';
	import IconWine from '$lib/icons/lucide/wine.svelte';
	import IconCigarette from '$lib/icons/lucide/cigarette.svelte';
	import IconUsersRound from '$lib/icons/lucide/users-round.svelte';

	type Range = '30d' | '3m' | '6m' | 'all';

	const checkInData = getCheckInData();
	const loadingIndicator = getLoadingIndicator();
	const ts = getTranslation();
	const auth = getAuth();

	let selectedRange = $state<Range>('30d');

	const ranges: { label: string; value: Range }[] = [
		{ label: ts.get.checkIn.range_30_days, value: '30d' },
		{ label: ts.get.checkIn.range_3_months, value: '3m' },
		{ label: ts.get.checkIn.range_6_months, value: '6m' },
		{ label: ts.get.checkIn.range_all, value: 'all' }
	];

	const trackers = $derived(checkInData.activeTrackers.filter((t) => t !== 'sports'));

	const filteredData = $derived.by((): CheckIn[] => {
		if (selectedRange === 'all') return checkInData.data;

		const days = selectedRange === '30d' ? 30 : selectedRange === '3m' ? 90 : 180;
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - days);
		const cutoffStr = getUrlFormat(cutoff);

		return checkInData.data.filter((e) => e.date >= cutoffStr);
	});

	function getChartData(type: CheckInType): { categories: string[]; values: number[] } {
		const entries = filteredData
			.filter((e) => e[type] !== null && e[type] !== 0)
			.sort((a, b) => a.date.localeCompare(b.date));

		return {
			categories: entries.map((e) => auth.getDateWithoutYearInUserPreferredFormat(e.date)),
			values: entries.map((e) => e[type] as number)
		};
	}

	function getIcon(type: CheckInType) {
		switch (type) {
			case 'mood': return IconSmile;
			case 'sleep': return IconBedSingle;
			case 'dreams': return IconSparkles;
			case 'work': return IconBriefcaseBusiness;
			case 'food_quality': return IconApple;
			case 'food_amount': return IconPizza;
			case 'water': return IconDroplets;
			case 'menstruation': return IconDroplet;
			case 'alcohol': return IconWine;
			case 'smoking': return IconCigarette;
			case 'social_life': return IconUsersRound;
			default: return null;
		}
	}

	onMount(async () => {
		loadingIndicator.start();
		await checkInData.load();
		loadingIndicator.stop();
	});
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-center gap-2 rounded-lg p-2">
		{#each ranges as range (range.value)}
			<button
				type="button"
				class="cursor-pointer rounded-lg px-4 py-2 drop-shadow-sm transition-all"
				class:bg-c-bg-elevated={selectedRange !== range.value}
				class:bg-c-btn={selectedRange === range.value}
				class:text-white={selectedRange === range.value}
				onclick={() => (selectedRange = range.value)}
			>
				{range.label}
			</button>
		{/each}
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		{#each trackers as type (type)}
			{#key selectedRange}
				<TrendChart label={ts.get.checkIn[type]} icon={getIcon(type)} {...getChartData(type)} />
			{/key}
		{/each}
	</div>
</div>
