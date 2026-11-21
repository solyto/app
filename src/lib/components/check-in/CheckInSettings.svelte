<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import type { Component } from 'svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import { AVAILABLE_SPORTS, type CheckInTracker, type SportId } from '$lib/types/check_in';
	import { trackerLabel } from '$lib/helpers/CheckInHelper';
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import Checkbox from '$lib/components/forms/Checkbox.svelte';
	import TrackerGlyph from '$lib/components/check-in/TrackerGlyph.svelte';
	import TrackerEditor from '$lib/components/check-in/settings/TrackerEditor.svelte';
	import IconDumbbell from '$lib/icons/lucide/dumbbell.svelte';
	import IconBike from '$lib/icons/lucide/bike.svelte';
	import IconMountain from '$lib/icons/lucide/mountain.svelte';
	import IconWavesLadder from '$lib/icons/lucide/waves-ladder.svelte';
	import IconFootprints from '$lib/icons/lucide/footprints.svelte';
	import IconChevronUp from '$lib/icons/lucide/chevron-up.svelte';
	import IconChevronDown from '$lib/icons/lucide/chevron-down.svelte';
	import IconChevronLeft from '$lib/icons/lucide/chevron-left.svelte';
	import IconPencil from '$lib/icons/lucide/pencil.svelte';
	import IconPlus from '$lib/icons/lucide/plus.svelte';
	import IconYoga from '$lib/components/ui/icons/IconYoga.svelte';
	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import SelectedSportButton from '$lib/components/check-in/SelectedSportButton.svelte';
	import ReplacementSportButton from '$lib/components/check-in/ReplacementSportButton.svelte';

	let { onClose, startWithNewTracker = false }: { onClose: () => void; startWithNewTracker?: boolean } = $props();

	const ts = getTranslation();
	const checkInData = getCheckInData();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();
	const trackerGroups = $derived([
		checkInData.trackers.filter((t) => checkInData.trackerService.isRating(t)),
		checkInData.trackers.filter((t) => !checkInData.trackerService.isRating(t))
	]);
	const ICON_BUTTON =
		'flex size-7 cursor-pointer items-center justify-center rounded-md text-c-neutral-5 transition-all hover:bg-c-neutral disabled:cursor-default disabled:opacity-30 dark:hover:bg-s-dark-3';

	// 'sports' is the choice of the five sports shown for the Sports tracker.
	let editing = $state<CheckInTracker | 'new' | 'sports' | null>(startWithNewTracker ? 'new' : null);
	let sportToReplace = $state<SportId | null>(null);
	// Bumped when a save fails, so the switches re-render from the store instead of keeping their flipped state.
	let failedSaves = $state<number>(0);

	async function run(action: () => Promise<boolean>): Promise<void> {
		loadingIndicator.start();
		const ok = await action();
		loadingIndicator.stop();
		if (!ok) {
			failedSaves++;
			notifications.error(ts.get.checkIn.save_error);
		}
	}

	// At least one tracker stays on, so the daily page never ends up empty.
	function isLastEnabled(tracker: CheckInTracker): boolean {
		return tracker.enabled && checkInData.activeTrackers.length === 1;
	}

	async function onSportClick(sportId: SportId): Promise<void> {
		const selected = checkInData.selectedSports;

		if (selected.includes(sportId)) {
			sportToReplace = sportToReplace === sportId ? null : sportId;
			return;
		}

		let next: SportId[];
		if (sportToReplace !== null) {
			next = selected.map((id) => (id === sportToReplace ? sportId : id));
			sportToReplace = null;
		} else if (selected.length < 5) {
			next = [...selected, sportId];
		} else {
			return;
		}

		await run(() => checkInData.saveSelectedSports(next));
	}

	function sportLabel(sportId: SportId): string {
		const sport = AVAILABLE_SPORTS.find((s) => s.id === sportId)!;
		return ts.get.checkIn[sport.labelKey];
	}

	function close(): void {
		sportToReplace = null;
		onClose();
	}

	function closeEditor(): void {
		if (startWithNewTracker) onClose();
		else editing = null;
	}

	const sportIcons: Record<SportId, Component> = {
		dumbbell: IconDumbbell,
		bike: IconBike,
		mountain: IconMountain,
		footprints: IconFootprints,
		waves_ladder: IconWavesLadder,
		yoga: IconYoga
	};
</script>

<ContentModal onClose={close} title={editing === null ? ts.get.checkIn.settings : editing === 'new' ? ts.get.checkIn.add_tracker : ts.get.checkIn.edit_tracker} rounded="2xl" p="4">
	<div class="flex w-full flex-col gap-2">
		{#if editing === 'sports'}
			<div class="flex w-full flex-col gap-3">
				<button type="button" class="flex cursor-pointer items-center gap-1 self-start text-sm" onclick={() => (editing = null)}>
					<IconChevronLeft class="size-4" />
					{ts.get.checkIn.sports}
				</button>
				<div class="flex gap-2">
					{#each checkInData.selectedSports as sportId, i (sportId)}
						<SelectedSportButton
							title={sportLabel(sportId)}
							position={i + 1}
							replacing={sportToReplace === sportId}
							icon={sportIcons[sportId]}
							onClick={() => onSportClick(sportId)}
						/>
					{/each}
				</div>
			</div>
		{:else if editing !== null}
			<TrackerEditor tracker={editing === 'new' ? null : editing} onDone={closeEditor} />
		{:else}
			<!-- Same columns as the rows below: centred over the checkboxes, then the toggle's width. -->
			<div class="flex w-full items-center justify-end gap-1">
				<span class="flex w-9 justify-center text-xs whitespace-nowrap">
					<HelpTooltip label={ts.get.checkIn.score} description={ts.get.checkIn.score_description} />
				</span>
				<span class="w-11" aria-hidden="true"></span>
			</div>
			{#key failedSaves}
				{#each trackerGroups as group, g (g)}
					<!-- Ratings and logs sit in separate areas of the daily page, so each group is ordered on its own. -->
					{#if g === 1 && trackerGroups[0].length > 0 && group.length > 0}
						<div class="my-1 border-t border-dashed border-c-neutral-3" aria-hidden="true"></div>
					{/if}
					{#each group as tracker, i (tracker.id)}
					<div class="flex w-full items-center justify-between gap-3">
						<div class="flex min-w-0 items-center gap-2" class:opacity-50={!tracker.enabled}>
							<TrackerGlyph {tracker} class="size-4 shrink-0 text-c-heading dark:text-c-primary" />
							<span class="truncate">{trackerLabel(tracker, ts.get.checkIn)}</span>
						</div>
						<div class="flex shrink-0 items-center gap-1">
							<!-- Your own trackers and Sports (which sports to show) can be edited; the controls are right-aligned, so the others stay in line without it. -->
							{#if tracker.key === null || tracker.type === 'sport'}
								<button type="button" class={ICON_BUTTON} aria-label={ts.get.checkIn.edit_tracker} title={ts.get.checkIn.edit_tracker} onclick={() => (editing = tracker.type === 'sport' ? 'sports' : tracker)}>
									<IconPencil class="size-4" />
								</button>
							{/if}
							<button type="button" class={ICON_BUTTON} disabled={i === 0} aria-label={ts.get.checkIn.move_up} title={ts.get.checkIn.move_up} onclick={() => run(() => checkInData.moveTracker(tracker, -1))}>
								<IconChevronUp class="size-4" />
							</button>
							<button type="button" class={ICON_BUTTON} disabled={i === group.length - 1} aria-label={ts.get.checkIn.move_down} title={ts.get.checkIn.move_down} onclick={() => run(() => checkInData.moveTracker(tracker, 1))}>
								<IconChevronDown class="size-4" />
							</button>
							<div class="flex w-9 items-center justify-center" class:opacity-30={!tracker.enabled} class:pointer-events-none={!tracker.enabled}>
								{#if tracker.type === 'scale'}
									<Checkbox isChecked={tracker.scored} onchange={() => run(() => checkInData.updateTracker(tracker, { scored: !tracker.scored }))} />
								{/if}
							</div>
							<div class:pointer-events-none={isLastEnabled(tracker)} class:opacity-50={isLastEnabled(tracker)}>
								<Toggle checked={tracker.enabled} onchange={() => run(() => checkInData.updateTracker(tracker, { enabled: !tracker.enabled }))} />
							</div>
						</div>
					</div>
					{/each}
				{/each}
			{/key}

			<button type="button" class="mt-2 flex cursor-pointer items-center gap-1 self-start text-sm font-semibold text-c-heading dark:text-c-primary" onclick={() => (editing = 'new')}>
				<IconPlus class="size-4" />
				{ts.get.checkIn.add_tracker}
			</button>
		{/if}
	</div>
</ContentModal>

{#if sportToReplace !== null}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs"
		transition:fade={{ duration: 150 }}
		onclick={() => (sportToReplace = null)}
		role="presentation"
	>
		<div
			class="rounded-2xl bg-c-bg-surface p-4 shadow-lg"
			transition:scale={{ start: 0.9, duration: 150 }}
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<p class="mb-3 text-sm font-semibold text-c-neutral-5 dark:text-c-neutral-4">{ts.get.checkIn.sport_replace_with}</p>
			<div class="flex gap-2">
				{#each AVAILABLE_SPORTS.filter((s) => !checkInData.selectedSports.includes(s.id)) as sport (sport.id)}
					<ReplacementSportButton
						title={ts.get.checkIn[sport.labelKey]}
						icon={sportIcons[sport.id]}
						onClick={() => onSportClick(sport.id)}
					/>
				{/each}
			</div>
		</div>
	</div>
{/if}
