<script lang="ts">
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getPlanner } from '$lib/state/Planner.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import type { PlannerEntry } from '$lib/types/planner';

	let {
		entry = null,
		defaultStart = 9 * 60,
		onClose
	} = $props<{
		entry: PlannerEntry | null;
		defaultStart?: number;
		onClose: () => void;
	}>();

	const ts = getTranslation();
	const planner = getPlanner();
	const loadingIndicator = getLoadingIndicator();

	let title = $state(entry?.title ?? '');
	let color = $state(entry?.color ?? '#3b82f6');
	let isAllDay = $state(entry?.is_all_day ?? false);
	let startHours = $state(Math.floor((entry?.start_minutes ?? defaultStart) / 60));
	let startMins = $state(Math.round((entry?.start_minutes ?? defaultStart) % 60));
	let durationHours = $state(Math.max(Math.floor((entry?.duration_minutes ?? 60) / 60), 1));
	let durationMins = $state(Math.max(Math.round((entry?.duration_minutes ?? 60) % 60), 0));

	async function save(): Promise<void> {
		if (title.trim() === '') return;

		const startMinutes = isAllDay ? 0 : startHours * 60 + startMins;
		const durationMinutes = isAllDay ? 1440 : durationHours * 60 + durationMins;

		loadingIndicator.start();
		if (entry === null) {
			await planner.createEntry({
				title: title.trim(),
				start_minutes: startMinutes,
				duration_minutes: durationMinutes,
				is_all_day: isAllDay,
				color: color.trim() === '' ? null : color.trim()
			});
		} else {
			await planner.updateEntry(entry.id, {
				title: title.trim(),
				start_minutes: startMinutes,
				duration_minutes: durationMinutes,
				is_all_day: isAllDay,
				color: color.trim() === '' ? null : color.trim()
			});
		}
		loadingIndicator.stop();
		onClose();
	}

	async function remove(): Promise<void> {
		if (entry === null) return;
		loadingIndicator.start();
		await planner.deleteEntry(entry.id);
		loadingIndicator.stop();
		onClose();
	}
</script>

<ContentModal title={entry ? ts.get.planner.edit_entry : ts.get.planner.add_entry} {onClose}>
	<div class="flex w-full flex-col gap-4 p-2">
		<label class="flex flex-col gap-1">
			<span class="text-sm font-semibold">{ts.get.planner.entry_title}</span>
			<TextInput bind:value={title} placeholder={ts.get.planner.entry_title_placeholder} />
		</label>

		<label class="flex w-full items-center justify-between text-sm font-semibold">
			<span>{ts.get.planner.all_day}</span>
			<input
				type="checkbox"
				class="h-4 w-4 accent-c-action"
				bind:checked={isAllDay}
				onchange={() => {
					if (isAllDay) {
						startHours = 0;
						startMins = 0;
						durationHours = 24;
						durationMins = 0;
					} else {
						startHours = 9;
						durationHours = 1;
					}
				}}
			/>
		</label>

		{#if !isAllDay}
			<div class="flex flex-col gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-sm font-semibold">{ts.get.planner.start}</span>
					<div class="flex items-center gap-1">
						<input
							type="number"
							min="0"
							max="23"
							class="w-14 rounded-lg border-1 border-c-neutral-2 px-2 py-1 text-sm focus:ring-2 focus:ring-d-lightblue focus:outline-none dark:border-s-dark-3 dark:bg-inherit"
							bind:value={startHours}
						/>
						<span>:</span>
						<input
							type="number"
							min="0"
							max="59"
							class="w-14 rounded-lg border-1 border-c-neutral-2 px-2 py-1 text-sm focus:ring-2 focus:ring-d-lightblue focus:outline-none dark:border-s-dark-3 dark:bg-inherit"
							bind:value={startMins}
						/>
					</div>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-sm font-semibold">{ts.get.planner.duration}</span>
					<div class="flex items-center gap-1">
						<input
							type="number"
							min="0"
							max="23"
							class="w-14 rounded-lg border-1 border-c-neutral-2 px-2 py-1 text-sm focus:ring-2 focus:ring-d-lightblue focus:outline-none dark:border-s-dark-3 dark:bg-inherit"
							bind:value={durationHours}
						/>
						<span>{ts.get.planner.duration_hours}</span>
						<input
							type="number"
							min="0"
							max="59"
							class="w-14 rounded-lg border-1 border-c-neutral-2 px-2 py-1 text-sm focus:ring-2 focus:ring-d-lightblue focus:outline-none dark:border-s-dark-3 dark:bg-inherit"
							bind:value={durationMins}
						/>
					</div>
				</label>
			</div>
		{/if}

		<label class="flex flex-col gap-1">
			<span class="text-sm font-semibold">{ts.get.planner.color}</span>
			<input
				type="color"
				class="h-9 w-16 cursor-pointer rounded-lg border-1 border-c-neutral-2 dark:border-s-dark-3"
				bind:value={color}
			/>
		</label>

		<div class="flex w-full items-center justify-between gap-2">
			<div>
				{#if entry !== null}
					<TextButton type="danger" title={ts.get.planner.delete} onclick={remove} />
				{/if}
			</div>
			<div class="flex gap-2">
				<TextButton type="slight" title={ts.get.planner.cancel} onclick={onClose} />
				<TextButton type="primary" title={ts.get.planner.save} onclick={save} />
			</div>
		</div>
	</div>
</ContentModal>
