<script lang="ts">
	import type {
		CheckInGoalComparison,
		CheckInGoalPeriod,
		CheckInTracker,
		CustomCheckInTrackerType
	} from '$lib/types/check_in';
	import { MAX_CHECK_IN_COUNT } from '$lib/types/check_in';
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import { trackerLabel } from '$lib/helpers/CheckInHelper';
	import TrackerGlyph from '$lib/components/check-in/TrackerGlyph.svelte';
	import TrackerIcon from '$lib/components/check-in/TrackerIcon.svelte';
	import IconPicker from '$lib/components/check-in/settings/IconPicker.svelte';
	import TrackerReminders from '$lib/components/check-in/settings/TrackerReminders.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import IconChevronLeft from '$lib/icons/lucide/chevron-left.svelte';

	let { tracker = null, onDone }: { tracker?: CheckInTracker | null; onDone: () => void } = $props();

	const checkInData = getCheckInData();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();
	const SECTION_TITLE = 'mb-2 text-sm font-semibold text-c-neutral-5 dark:text-c-neutral-4';
	const TYPES: CustomCheckInTrackerType[] = ['yes_no', 'count', 'scale'];

	// After creating, the editor stays open on the new tracker so a goal and reminders can be added.
	let created = $state<CheckInTracker | null>(null);
	const current = $derived(checkInData.trackers.find((t) => t.id === (created ?? tracker)?.id) ?? null);

	let name = $state<string>(tracker?.name ?? '');
	let type = $state<CustomCheckInTrackerType>('yes_no');
	let icon = $state<string | null>(tracker?.icon ?? null);
	let comparison = $state<CheckInGoalComparison | 'none'>(tracker?.goal?.comparison ?? 'none');
	let target = $state<number | null>(tracker?.goal?.target ?? null);
	let period = $state<CheckInGoalPeriod>(tracker?.goal?.period ?? 'week');
	let choosingIcon = $state<boolean>(false);
	let confirmingDelete = $state<boolean>(false);

	const isCustom = $derived(current === null || current.key === null);
	const trackerType = $derived(current?.type ?? type);
	const countsDays = $derived(trackerType === 'yes_no' || trackerType === 'sport');
	const periods = $derived<CheckInGoalPeriod[]>(countsDays ? ['week', 'month'] : ['day', 'week', 'month']);
	const targetMax = $derived(countsDays ? (period === 'week' ? 7 : 31) : trackerType === 'scale' ? 5 : MAX_CHECK_IN_COUNT);
	const targetValid = $derived(
		target !== null &&
			target >= (trackerType === 'scale' ? 1 : 0) &&
			target <= targetMax &&
			(trackerType === 'scale' || Number.isInteger(target))
	);
	const canSave = $derived((!isCustom || name.trim() !== '') && (comparison === 'none' || targetValid));
	const valueCount = $derived(current ? checkInData.values.filter((v) => v.tracker_id === current.id).length : 0);

	function typeLabel(t: CustomCheckInTrackerType | 'sport'): string {
		return { scale: ts.get.checkIn.type_scale, yes_no: ts.get.checkIn.type_yes_no, count: ts.get.checkIn.type_count, sport: ts.get.checkIn.sports }[t];
	}

	function typeHint(t: CustomCheckInTrackerType): string {
		return { scale: ts.get.checkIn.type_scale_hint, yes_no: ts.get.checkIn.type_yes_no_hint, count: ts.get.checkIn.type_count_hint }[t];
	}

	function comparisonOptions(): { label: string; value: string }[] {
		return [
			{ label: ts.get.checkIn.goal_none, value: 'none' },
			{ label: ts.get.checkIn.goal_at_least, value: 'at_least' },
			{ label: ts.get.checkIn.goal_at_most, value: 'at_most' }
		];
	}

	function periodOptions(): { label: string; value: string }[] {
		const labels = { day: ts.get.checkIn.goal_per_day, week: ts.get.checkIn.goal_per_week, month: ts.get.checkIn.goal_per_month };
		return periods.map((p) => ({ label: labels[p], value: p }));
	}

	function setComparison(value: string): void {
		comparison = value as CheckInGoalComparison | 'none';
		if (!periods.includes(period)) period = periods[0];
	}

	function chooseIcon(selected: string): void {
		icon = selected;
		choosingIcon = false;
	}

	async function run(action: () => Promise<boolean>): Promise<boolean> {
		loadingIndicator.start();
		const ok = await action();
		loadingIndicator.stop();
		if (!ok) notifications.error(ts.get.checkIn.save_error);
		return ok;
	}

	async function create(): Promise<void> {
		if (!canSave) return;
		loadingIndicator.start();
		const tracker = await checkInData.createTracker({ name: name.trim(), type, icon });
		loadingIndicator.stop();

		if (tracker) created = tracker;
		else notifications.error(ts.get.checkIn.save_error);
	}

	async function save(): Promise<void> {
		if (!current || !canSave) return;

		const ok = await run(async () => {
			const updated = !isCustom || (await checkInData.updateTracker(current, { name: name.trim(), icon }));
			if (!updated) return false;

			if (comparison === 'none') return current.goal === null || checkInData.deleteGoal(current);
			return checkInData.setGoal(current, { comparison, period, target: target! });
		});

		if (ok) onDone();
	}

	async function remove(): Promise<void> {
		confirmingDelete = false;
		if (current && (await run(() => checkInData.deleteTracker(current)))) onDone();
	}
</script>

{#if choosingIcon}
	<div class="flex w-full flex-col gap-3">
		<button type="button" class="flex cursor-pointer items-center gap-1 self-start text-sm" onclick={() => (choosingIcon = false)}>
			<IconChevronLeft class="size-4" />
			{ts.get.checkIn.choose_icon}
		</button>
		<IconPicker selected={icon} onSelect={chooseIcon} />
	</div>
{:else}
	<div class="flex w-full flex-col gap-5">
		{#if current && !isCustom}
			<div class="flex items-center gap-3">
				<TrackerGlyph tracker={current} class="size-6 text-c-heading dark:text-c-primary" />
				<span class="text-lg font-bold">{trackerLabel(current, ts.get.checkIn)}</span>
			</div>
		{:else}
			<div>
				<p class={SECTION_TITLE}>{ts.get.checkIn.tracker_name}</p>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-c-neutral-1 text-c-heading transition-all hover:bg-c-neutral dark:border-s-dark-3 dark:text-c-primary dark:hover:bg-s-dark-3"
						title={ts.get.checkIn.choose_icon}
						aria-label={ts.get.checkIn.choose_icon}
						onclick={() => (choosingIcon = true)}
					>
						<TrackerIcon name={icon} class="size-5" />
					</button>
					<TextInput bind:value={name} placeholder={ts.get.checkIn.tracker_name_hint} maxlength={50} />
				</div>
			</div>
		{/if}

		<div>
			<p class={SECTION_TITLE}>{ts.get.checkIn.tracker_type}</p>
			{#if current}
				<p class="text-sm">{typeLabel(current.type)}</p>
			{:else}
				<div class="flex flex-col gap-2">
					{#each TYPES as option (option)}
						<button
							type="button"
							class="cursor-pointer rounded-lg border-2 p-2 text-left transition-all"
							class:border-c-primary={type === option}
							class:border-c-neutral-1={type !== option}
							class:dark:border-s-dark-3={type !== option}
							aria-pressed={type === option}
							onclick={() => (type = option)}
						>
							<span class="block text-sm font-semibold">{typeLabel(option)}</span>
							<span class="block text-xs text-c-neutral-5 dark:text-c-neutral-4">{typeHint(option)}</span>
						</button>
					{/each}
				</div>
				<p class="mt-2 text-xs text-c-neutral-5 dark:text-c-neutral-4">{ts.get.checkIn.type_fixed}</p>
			{/if}
		</div>

		{#if current}
			<div>
				<p class={SECTION_TITLE}>{ts.get.checkIn.goal}</p>
				<div class="flex flex-wrap items-center gap-2">
					<div class="w-32"><Select value={comparison} options={comparisonOptions()} onchange={setComparison} ariaLabel={ts.get.checkIn.goal} /></div>
					{#if comparison !== 'none'}
						<div class="w-20">
							<NumberInput bind:value={target} min={trackerType === 'scale' ? 1 : 0} max={targetMax} step={trackerType === 'scale' ? 0.1 : 1} />
						</div>
						{#if countsDays}
							<span class="text-sm">{ts.get.checkIn.goal_unit_days}</span>
						{:else if trackerType === 'scale'}
							<span class="text-sm">{ts.get.checkIn.goal_unit_average}</span>
						{/if}
						<div class="w-32"><Select value={period} options={periodOptions()} onchange={(value) => (period = value as CheckInGoalPeriod)} ariaLabel={ts.get.checkIn.goal} /></div>
					{/if}
				</div>
			</div>

			<TrackerReminders tracker={current} />
		{/if}

		<div class="flex items-center justify-between gap-2">
			{#if current && isCustom}
				<TextButton title={ts.get.checkIn.delete_tracker} type="plain" class="text-c-danger" onclick={() => (confirmingDelete = true)} />
			{:else}
				<span></span>
			{/if}
			{#if current}
				<TextButton title={ts.get.layout.save} type="primary" disabled={!canSave} onclick={save} />
			{:else}
				<TextButton title={ts.get.checkIn.add_tracker} type="primary" disabled={!canSave} onclick={create} />
			{/if}
		</div>
	</div>
{/if}

{#if confirmingDelete && current}
	<ConfirmationModal
		type="confirm-delete"
		title={ts.get.checkIn.delete_tracker}
		description={ts.get.checkIn.delete_tracker_question.replace('%s', trackerLabel(current, ts.get.checkIn)).replace('{n}', String(valueCount))}
		onConfirm={remove}
		onCancel={() => (confirmingDelete = false)}
	/>
{/if}
