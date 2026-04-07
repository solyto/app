<script lang="ts">
	import { urls } from '$lib/config/urls';
	import { getUrlFormat } from '$lib/helpers/DateHelper';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { scale, fade } from 'svelte/transition';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { ALL_CHECK_IN_TRACKERS, AVAILABLE_SPORTS, type CheckInType, type SportId } from '$lib/types/check_in';
	import InlineEditButton from '$lib/components/ui/buttons/InlineEditButton.svelte';
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import CloseButton from '$lib/components/ui/buttons/CloseButton.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import IconDumbbell from '@lucide/svelte/icons/dumbbell';
	import IconBike from '@lucide/svelte/icons/bike';
	import IconMountain from '@lucide/svelte/icons/mountain';
	import IconWavesLadder from '@lucide/svelte/icons/waves-ladder';
	import IconFootprints from '@lucide/svelte/icons/footprints';
	import IconYoga from '$lib/components/ui/icons/IconYoga.svelte';

	const ts = getTranslation();
	const checkInData = getCheckInData();
	const loadingIndicator = getLoadingIndicator();

	let modalOpen = $state(false);
	let enabledMap = $state<Record<string, boolean>>({});
	let selectedSports = $state<SportId[]>([]);
	let sportToReplace = $state<SportId | null>(null);

	function openModal(): void {
		enabledMap = Object.fromEntries(
			ALL_CHECK_IN_TRACKERS.map((t) => [t, checkInData.settings.enabledTrackers.includes(t)])
		);
		selectedSports = [...checkInData.settings.selectedSports];
		sportToReplace = null;
		modalOpen = true;
	}

	async function onToggle(tracker: CheckInType): Promise<void> {
		const enabled = ALL_CHECK_IN_TRACKERS.filter((t) => enabledMap[t]);
		if (enabled.length === 0) {
			enabledMap[tracker] = true;
			return;
		}
		loadingIndicator.start();
		await checkInData.saveSettings({ enabledTrackers: enabled, selectedSports });
		loadingIndicator.stop();
	}

	async function onSportClick(sportId: SportId): Promise<void> {
		const isSelected = selectedSports.includes(sportId);

		if (isSelected) {
			sportToReplace = sportToReplace === sportId ? null : sportId;
			return;
		}

		if (sportToReplace !== null) {
			const idx = selectedSports.indexOf(sportToReplace);
			const next = [...selectedSports];
			next[idx] = sportId;
			selectedSports = next;
			sportToReplace = null;
		} else if (selectedSports.length < 5) {
			selectedSports = [...selectedSports, sportId];
		} else {
			return;
		}

		loadingIndicator.start();
		await checkInData.saveSettings({ enabledTrackers: ALL_CHECK_IN_TRACKERS.filter((t) => enabledMap[t]), selectedSports });
		loadingIndicator.stop();
	}

	const sportIcons: Record<SportId, unknown> = {
		dumbbell: IconDumbbell,
		bike: IconBike,
		mountain: IconMountain,
		footprints: IconFootprints,
		waves_ladder: IconWavesLadder,
		yoga: IconYoga
	};
</script>

<div class="relative flex w-full flex-row items-center space-x-4 p-4 pt-0">
	<a href={resolve(urls.checkIn)}>
		<h1 class="text-2xl" class:font-bold={page.url.pathname === '/check-in'}>
			{ts.get.checkIn.overview}
		</h1>
	</a>
	<a href={resolve(urls.checkInDate, { date: getUrlFormat(new Date()) })}>
		<h1
			class="text-2xl"
			class:font-bold={page.url.pathname !== '/check-in' &&
				page.url.pathname !== '/check-in/statistics'}
		>
			{ts.get.checkIn.daily}
		</h1>
	</a>
	<a href={resolve(urls.checkInStatistics)}>
		<h1 class="text-2xl" class:font-bold={page.url.pathname === '/check-in/statistics'}>
			{ts.get.checkIn.statistics}
		</h1>
	</a>
	<div class="ml-auto">
		<InlineEditButton onClick={openModal} />
	</div>
</div>

{#if modalOpen}
	<ContentModal onClose={() => { modalOpen = false; sportToReplace = null; }} title={ts.get.checkIn.settings} rounded="2xl" p="4">
		<div class="flex w-full flex-col gap-2">
			<div class="mb-1 flex items-center justify-between md:hidden">
				<span class="text-lg font-bold text-c-heading dark:text-c-primary">{ts.get.checkIn.settings}</span>
				<CloseButton onClick={() => { modalOpen = false; sportToReplace = null; }} inModal={false} />
			</div>
			{#each ALL_CHECK_IN_TRACKERS as tracker (tracker)}
				<div class="flex w-full justify-between">
					<span>{ts.get.checkIn[tracker]}</span>
					<Toggle
						bind:checked={enabledMap[tracker]}
						onchange={() => onToggle(tracker)}
					/>
				</div>
			{/each}
			{#if enabledMap['sports']}
				<div class="mt-2 border-t border-c-neutral-1 pt-3 dark:border-s-dark">
					<p class="mb-2 text-sm font-semibold text-c-neutral-5 dark:text-c-neutral-4">{ts.get.checkIn.sports}</p>
					<div class="flex gap-2">
						{#each selectedSports as sportId, i (sportId)}
							{@const sport = AVAILABLE_SPORTS.find((s) => s.id === sportId)!}
							{@const isReplacing = sportToReplace === sportId}
							<button
								type="button"
								class="group relative size-14 cursor-pointer rounded-lg border-3 p-3 shadow-xs transition-all {isReplacing ? 'border-c-action bg-c-action/10' : 'border-c-neutral-1 bg-c-neutral hover:bg-c-neutral-1 dark:border-s-dark dark:bg-s-dark-3 dark:hover:bg-s-dark'}"
								onclick={() => onSportClick(sportId)}
								title={ts.get.checkIn[sport.labelKey]}
							>
								<span class="absolute top-0.5 right-1 text-xs font-bold {isReplacing ? 'text-c-action' : 'text-c-neutral-4 dark:text-c-neutral-5'}">{i + 1}</span>
								<svelte:component this={sportIcons[sportId]} class="size-full" />
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</ContentModal>
{/if}

{#if sportToReplace !== null}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs"
		transition:fade={{ duration: 150 }}
		onclick={() => (sportToReplace = null)}
	>
		<div
			class="rounded-2xl bg-c-bg-surface p-4 shadow-lg"
			transition:scale={{ start: 0.9, duration: 150 }}
			onclick={(e) => e.stopPropagation()}
		>
			<p class="mb-3 text-sm font-semibold text-c-neutral-5 dark:text-c-neutral-4">{ts.get.checkIn.sport_replace_with}</p>
			<div class="flex gap-2">
				{#each AVAILABLE_SPORTS.filter((s) => !selectedSports.includes(s.id)) as sport (sport.id)}
					<button
						type="button"
						class="group size-14 cursor-pointer rounded-lg border-3 border-c-neutral-1 p-3 shadow-xs transition-all hover:bg-c-neutral dark:border-s-dark dark:hover:bg-s-dark-3"
						onclick={() => onSportClick(sport.id)}
						title={ts.get.checkIn[sport.labelKey]}
					>
						<svelte:component this={sportIcons[sport.id]} class="size-full" />
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
