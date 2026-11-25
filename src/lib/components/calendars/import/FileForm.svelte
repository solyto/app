<script lang="ts">
	import ColorPicker from '$lib/components/forms/ColorPicker.svelte';
	import FileUpload from '$lib/components/forms/FileUpload.svelte';
	import SegmentedControl from '$lib/components/forms/SegmentedControl.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import CalendarImportService, { MAX_CALENDAR_NAME_LENGTH } from '$lib/services/CalendarImportService';
	import type { Calendar, ImportFileTarget } from '$lib/types/calendar';

	let { targets, busy, onsubmit }: {
		targets: Calendar[];
		busy: boolean;
		onsubmit: (file: File, target: ImportFileTarget) => void;
	} = $props();

	const NO_COLOR = 'var(--color-c-neutral-2)';

	const ts = getTranslation();
	const service = new CalendarImportService();
	const uid = $props.id();

	let file = $state<File | null>(null);
	let targetType = $state<ImportFileTarget['type']>('new');
	let name = $state<string>('');
	let hex = $state<string>(NO_COLOR);
	let pickedCalendarId = $state<string | null>(null);
	let suggestedName = '';

	const targetOptions = [
		{ label: ts.get.calendar.import_target_new, value: 'new' },
		{ label: ts.get.calendar.import_target_existing, value: 'existing' }
	];

	async function pick(picked: File): Promise<boolean> {
		const suggestion = await nameFor(picked);
		if (file === null || name === suggestedName) name = suggestion;
		suggestedName = suggestion;
		file = picked;
		return true;
	}

	async function nameFor(picked: File): Promise<string> {
		const content = await picked.text().catch(() => '');
		return service.calendarName(content) ?? service.defaultCalendarName(picked.name);
	}

	function calendarId(): string {
		return pickedCalendarId ?? targets[0]?.id.toString() ?? '';
	}

	function changeCalendar(value: string): void {
		pickedCalendarId = value;
	}

	function calendarOptions(): { label: string; value: string }[] {
		return targets.map((calendar) => ({ label: calendar.name, value: calendar.id.toString() }));
	}

	function changeTarget(value: string): void {
		targetType = value === 'existing' ? 'existing' : 'new';
	}

	function target(): ImportFileTarget {
		if (targetType === 'existing') return { type: 'existing', calendarId: Number(calendarId()) };
		return { type: 'new', name, color: hex === NO_COLOR ? null : hex };
	}

	function canSubmit(): boolean {
		return !busy && file !== null && (targetType === 'new' || calendarId() !== '');
	}

	function submit(): void {
		if (file !== null && canSubmit()) onsubmit(file, target());
	}
</script>

<div class="flex flex-col gap-3">
	<FileUpload accept=".ics" onfile={pick} />
	{#if targets.length > 0}
		<SegmentedControl value={targetType} options={targetOptions} onchange={changeTarget} />
	{/if}
	{#if targetType === 'new'}
		<ModalFormRow label={ts.get.layout.name} labelFor="{uid}-name">
			<div class="flex items-center gap-2">
				<ColorPicker bind:hex />
				<TextInput bind:value={name} id="{uid}-name" maxlength={MAX_CALENDAR_NAME_LENGTH} />
			</div>
		</ModalFormRow>
	{:else}
		<ModalFormRow label={ts.get.calendar.calendar}>
			<Select value={calendarId()} onchange={changeCalendar} options={calendarOptions()} ariaLabel={ts.get.calendar.calendar} />
		</ModalFormRow>
	{/if}
	<TextButton type="primary" title={ts.get.calendar.import_submit} disabled={!canSubmit()} onclick={submit} class="mt-2" />
</div>
