<script lang="ts">
	import { init } from 'echarts';
	import type { ECharts } from 'echarts';
	import { onMount, onDestroy, tick } from 'svelte';

	let { title, categories, values } = $props<{
		title?: string;
		categories?: string[];
		values?: number[];
	}>();

	let chartContainer = $state<HTMLDivElement | null>(null);
	let myChart = $state<ECharts | null>(null);
	let isInitialized = $state<boolean>(false);

	function createChart() {
		if (!chartContainer || !categories?.length || !values?.length) return;

		if (myChart) {
			myChart.dispose();
			myChart = null;
		}

		myChart = init(chartContainer);

		const options = {
			title: {
				text: title || ''
			},
			tooltip: {
				trigger: 'axis'
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '10%',
				containLabel: true
			},
			xAxis: {
				type: 'category',
				data: categories
			},
			yAxis: {
				type: 'value'
			},
			series: [
				{
					type: 'line',
					smooth: true,
					data: values,
					itemStyle: {
						color: '#61d96a'
					}
				}
			]
		};

		myChart.setOption(options);
		isInitialized = true;
	}

	onMount(async () => {
		await tick();
		createChart();

		const handleResize = () => {
			if (myChart) {
				myChart.resize();
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	onDestroy(() => {
		if (myChart) {
			myChart.dispose();
			myChart = null;
		}
	});

	// Only update when data actually changes, not on every render
	$effect(() => {
		if (!isInitialized && chartContainer) {
			createChart();
		}
	});
</script>

<div bind:this={chartContainer} class="h-96 w-full"></div>
