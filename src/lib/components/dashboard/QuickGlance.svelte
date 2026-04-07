<script lang="ts">
	import { blur } from 'svelte/transition';
	import { onMount, tick } from 'svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getShortcuts } from '$lib/state/Shortcuts.svelte';
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { grabFaviconFromUrl } from '$lib/helpers/ImageHelper';
	import type { CheckInType } from '$lib/types/check_in';
	import CheckInStatisticsService from '$lib/services/CheckInStatisticsService';
	import ManageShortcuts from '$lib/components/shortcuts/ManageShortcuts.svelte';
	import IconBedSingle from '@lucide/svelte/icons/bed-single';
	import IconSparkles from '@lucide/svelte/icons/sparkles';
	import IconBriefcaseBusiness from '@lucide/svelte/icons/briefcase-business';
	import IconApple from '@lucide/svelte/icons/apple';
	import IconDroplets from '@lucide/svelte/icons/droplets';
	import IconSmile from '@lucide/svelte/icons/smile';
	import IconPizza from '@lucide/svelte/icons/pizza';
	import IconActivity from '@lucide/svelte/icons/activity';
	import IconDroplet from '@lucide/svelte/icons/droplet';
	import IconWine from '@lucide/svelte/icons/wine';
	import IconCigarette from '@lucide/svelte/icons/cigarette';
	import IconExternalLink from '@lucide/svelte/icons/external-link';
	import IconGlobe from '@lucide/svelte/icons/globe';
	import IconPen from '@lucide/svelte/icons/pen';
	import TimeTrackingDashboardWidget from '$lib/components/dashboard/TimeTrackingDashboardWidget.svelte';

	const ts = getTranslation();
	const shortcuts = getShortcuts();
	const checkInData = getCheckInData();
	const service = new CheckInStatisticsService();

	const entries = $derived(checkInData.activeTrackers.filter((t) => t !== 'sports'));
	const totalMean = $derived(service.getTotalMeanValue(entries));

	let loaded = $state(false);
	let manageModalOpen = $state(false);

	onMount(async () => {
		await Promise.all([checkInData.load(), shortcuts.load()]);
		service.setData(checkInData.data);
		await tick();
		loaded = true;
	});

	function getIcon(type: CheckInType) {
		switch (type) {
			case 'mood':
				return IconSmile;
			case 'sleep':
				return IconBedSingle;
			case 'dreams':
				return IconSparkles;
			case 'work':
				return IconBriefcaseBusiness;
			case 'food_quality':
				return IconApple;
			case 'food_amount':
				return IconPizza;
			case 'water':
				return IconDroplets;
			case 'menstruation':
				return IconDroplet;
			case 'alcohol':
				return IconWine;
			case 'smoking':
				return IconCigarette;
			default:
				return null;
		}
	}

	function getBarColor(value: number): string {
		if (value >= 4) return 'bg-c-success';
		if (value >= 3) return 'bg-c-btn';
		if (value >= 2) return 'bg-c-warning';
		if (value >= 1.5) return 'bg-c-action';
		return 'bg-c-danger';
	}

	function getBarColorFood(value: number): string {
		if (value >= 3.5 && value < 4.5) return 'bg-c-success';
		if (value >= 3) return 'bg-c-btn';
		if (value >= 2) return 'bg-c-warning';
		if (value >= 1.5) return 'bg-c-action';
		return 'bg-c-danger';
	}


	function toggleModal(): void {
		manageModalOpen = !manageModalOpen;
	}
</script>

{#if loaded}
	<div class="flex flex-col gap-12" in:blur>
		<div>
			<div class="mb-3 flex items-center gap-2">
				<IconActivity size={15} class="text-c-heading dark:text-c-primary" />
				<span
					class="text-xs font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary"
				>
					{ts.get.nav.checkIn}
				</span>
			</div>
			<div class="flex flex-col gap-2.5">
				{#each entries as entry (entry)}
					{@const value = service.getMeanValue(entry)}
					{@const IconComponent = getIcon(entry)}
					<div class="flex items-center gap-2.5">
						{#if IconComponent}
							<IconComponent
								class="h-3.5 w-3.5 shrink-0 text-c-neutral-4 dark:text-c-neutral-5"
							/>
						{/if}
						<div class="min-w-0 flex-1">
							<div class="mb-0.5 flex items-center justify-between">
								<span class="text-xs text-c-neutral-6 dark:text-c-neutral-4">
									{ts.get.checkIn[entry]}
								</span>
								<span class="text-xs font-medium text-c-neutral-8 dark:text-white">
									{#if isNaN(value)}
										-
									{:else}
										{value.toFixed(2)}
									{/if}
								</span>
							</div>
							<div
								class="h-1 overflow-hidden rounded-full bg-c-neutral-1 dark:bg-s-dark-3"
							>
								<div
									class="h-full rounded-full transition-all duration-300 {entry === 'food_amount'
										? getBarColorFood(value)
										: getBarColor(value)}"
									style="width: {isNaN(value) ? 0 : (value / 5) * 100}%"
								></div>
							</div>
						</div>
					</div>
				{/each}
				<div class="mt-1 border-t border-c-neutral-1 pt-2 dark:border-s-dark-3">
					<div class="flex items-center gap-2.5">
						<span
							class="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-xs font-bold text-c-primary"
							>∑</span
						>
						<div class="min-w-0 flex-1">
							<div class="mb-0.5 flex items-center justify-between">
								<span class="text-xs font-medium text-c-neutral-7 dark:text-c-neutral-3">
									{ts.get.checkIn.total}
								</span>
								<span class="text-xs font-semibold text-c-primary">
									{#if isNaN(totalMean)}
										-
									{:else}
										{totalMean.toFixed(2)}
									{/if}
								</span>
							</div>
							<div
								class="h-1 overflow-hidden rounded-full bg-c-neutral-1 dark:bg-s-dark-3"
							>
								<div
									class="h-full rounded-full bg-c-primary transition-all duration-300"
									style="width: {isNaN(totalMean) ? 0 : (totalMean / 5) * 100}%"
								></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<TimeTrackingDashboardWidget />

		{#if shortcuts.loaded && shortcuts.shortcuts.length > 0}
			<div>
				<div class="mb-2 flex items-center gap-2">
					<IconGlobe size={15} class="text-c-heading dark:text-c-primary" />
					<span
						class="text-xs font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary"
					>
						{ts.get.widgets.shortcuts}
					</span>
					<button
						class="ml-auto cursor-pointer text-c-neutral-3 transition-colors hover:text-c-neutral-5 dark:text-c-neutral-6 dark:hover:text-c-neutral-4"
						onclick={toggleModal}
					>
						<IconPen size={13} />
					</button>
				</div>
				<div class="flex flex-col gap-1">
					{#each shortcuts.shortcuts as shortcut (shortcut.id)}
						<a
							href={shortcut.url}
							target="_blank"
							rel="external"
							class="group flex items-center gap-2.5 py-0.5 transition-colors"
						>
							<img
								src={grabFaviconFromUrl(shortcut.url)}
								alt="Favicon"
								class="h-4 w-4 shrink-0"
							/>
							<span
								class="truncate text-sm text-c-neutral-7 transition-colors group-hover:text-c-primary dark:text-c-neutral-3"
							>
								{shortcut.title}
							</span>
							<IconExternalLink
								size={12}
								class="ml-auto shrink-0 text-c-neutral-4 opacity-0 transition-opacity group-hover:opacity-100"
							/>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

{#if manageModalOpen}
	<ManageShortcuts onClose={toggleModal} />
{/if}
