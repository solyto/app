<script lang="ts">
	import type { CheckInTracker, CustomCheckInTrackerType } from '$lib/types/check_in';
	import { getCheckInData } from '$lib/state/CheckInData.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import { trackerLabel } from '$lib/helpers/CheckInHelper';
	import TrackerIcon from '$lib/components/check-in/TrackerIcon.svelte';
	import IconPicker from '$lib/components/check-in/settings/IconPicker.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import IconChevronLeft from '$lib/icons/lucide/chevron-left.svelte';

	let { tracker = null, onDone }: { tracker?: CheckInTracker | null; onDone: () => void } = $props();

	const checkInData = getCheckInData();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();
	const TYPES: CustomCheckInTrackerType[] = ['yes_no', 'count', 'scale'];

	const current = $derived(checkInData.trackers.find((t) => t.id === tracker?.id) ?? null);

	let name = $state<string>(tracker?.name ?? '');
	let type = $state<CustomCheckInTrackerType>('yes_no');
	let icon = $state<string | null>(tracker?.icon ?? null);
	let choosingIcon = $state<boolean>(false);
	let confirmingDelete = $state<boolean>(false);
	let busy = $state<boolean>(false);

	const canSave = $derived(name.trim() !== '');
	const valueCount = $derived(current?.values_count ?? 0);

	function typeLabel(t: CustomCheckInTrackerType | 'sport'): string {
		return { scale: ts.get.checkIn.type_scale, yes_no: ts.get.checkIn.type_yes_no, count: ts.get.checkIn.type_count, sport: ts.get.checkIn.sports }[t];
	}

	function typeHint(t: CustomCheckInTrackerType): string {
		return { scale: ts.get.checkIn.type_scale_hint, yes_no: ts.get.checkIn.type_yes_no_hint, count: ts.get.checkIn.type_count_hint }[t];
	}

	function chooseIcon(selected: string): void {
		icon = selected;
		choosingIcon = false;
	}

	// One write at a time: a double click mustn't create the tracker twice.
	async function run(action: () => Promise<boolean>): Promise<boolean> {
		if (busy) return false;
		busy = true;
		loadingIndicator.start();
		try {
			const ok = await action();
			if (!ok) notifications.error(ts.get.checkIn.save_error);
			return ok;
		} finally {
			loadingIndicator.stop();
			busy = false;
		}
	}

	async function create(): Promise<void> {
		if (!canSave) return;

		if (await run(async () => (await checkInData.createTracker({ name: name.trim(), type, icon })) !== null)) onDone();
	}

	async function save(): Promise<void> {
		if (!current || !canSave) return;

		if (await run(() => checkInData.updateTracker(current, { name: name.trim(), icon }))) onDone();
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
		<div>
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

		<div>
			{#if current}
				<p class="text-sm">{typeLabel(current.type)}</p>
			{:else}
				<!-- Option rows as in the library recommendations; the chosen one gets the coloured bar. -->
				<div class="flex flex-col gap-2">
					{#each TYPES as option (option)}
						<button
							type="button"
							class="relative w-full cursor-pointer rounded-lg border-1 border-c-neutral-1 bg-c-bg-surface text-left shadow-sm transition-all hover:bg-c-neutral dark:border-s-dark-2 dark:hover:bg-s-dark-3"
							class:bg-c-neutral={type === option}
							class:dark:bg-s-dark-3={type === option}
							aria-pressed={type === option}
							onclick={() => (type = option)}
						>
							<div
								class="absolute top-2 bottom-2 left-3 w-1 rounded-lg"
								class:bg-c-btn={type === option}
								class:bg-c-neutral-2={type !== option}
								class:dark:bg-s-dark-2={type !== option}
							></div>
							<div class="ml-4 px-4 py-2">
								<span class="block">{typeLabel(option)}</span>
								<span class="block text-xs text-c-neutral-5 dark:text-c-neutral-4">{typeHint(option)}</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex items-center justify-between gap-2">
			{#if current}
				<TextButton title={ts.get.checkIn.delete_tracker} type="plain" class="text-c-danger" onclick={() => (confirmingDelete = true)} />
			{:else}
				<span></span>
			{/if}
			{#if current}
				<TextButton title={ts.get.layout.save} disabled={!canSave || busy} onclick={save} />
			{:else}
				<TextButton title={ts.get.checkIn.add_tracker} disabled={!canSave || busy} onclick={create} />
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
