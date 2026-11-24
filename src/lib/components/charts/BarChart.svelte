<script lang="ts">
	import { init } from './echarts';
	import type { ECharts } from './echarts';
	import { onMount, onDestroy, tick } from 'svelte';
	import { resolveCssColor } from '$lib/helpers/ColorHelper';

	let {
		title,
		categories,
		values,
		colors,
		opacity = 1,
		valueFormatter = (v: number) => String(v)
	}: {
		title?: string;
		categories?: string[];
		values?: number[];
		colors?: string[];
		opacity?: number;
		valueFormatter?: (value: number) => string;
	} = $props();

	let chartContainer: HTMLDivElement | null = null;
	let myChart: ECharts | null = null;
	let isInitialized = false;

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
				trigger: 'axis',
				formatter: (params: { name: string; value: number }[]) =>
					`${params[0].name}: ${valueFormatter(params[0].value)}`
			},
			grid: {
				top: title ? 60 : 8,
				left: 0,
				right: 0,
				bottom: 0,
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
					type: 'bar',
					data: colors
						? values.map((value: number, i: number) => ({
								value,
								itemStyle: { color: resolveCssColor(colors[i]) }
							}))
						: values,
					itemStyle: {
						color: '#61d96a',
						opacity
					}
				}
			]
		};

		myChart.setOption(options);
		isInitialized = true;
	}

	onMount(() => {
		tick().then(createChart);

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

	$effect(() => {
		if (!isInitialized && chartContainer) {
			createChart();
		}
	});
</script>

<div bind:this={chartContainer} class="h-96 w-full"></div>
