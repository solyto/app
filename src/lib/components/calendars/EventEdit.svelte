<script lang="ts">
	import { getCalendars } from '$lib/state/Calendars.svelte';
	import SlidingSideBar from '$lib/components/ui/SlidingSideBar.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import type {
		EventForm,
		CreateEventRequest,
		UpdateEventRequest,
		Event
	} from '$lib/types/calendar';
	import SvelteDateInput from '$lib/components/forms/SvelteDateInput.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import ChooseCalendar from '$lib/components/calendars/ChooseCalendar.svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import TimePickerTest from '$lib/components/forms/TimePickerTest.svelte';
	import ChooseRecurrenceRule from '$lib/components/calendars/ChooseRecurrenceRule.svelte';
	import RecurrenceActionModal from '$lib/components/calendars/RecurrenceActionModal.svelte';
	import { formatFloatingDate } from '$lib/helpers/DateHelper';

	const calendars = getCalendars();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();
	const emptyForm: EventForm = {
		calendar_id: 0,
		title: '',
		description: '',
		location: '',
		is_all_day: false,
		is_recurring: false,
		recurrence_rule: null,
		recurrence_end: null,
		start_date: new SvelteDate(),
		start_hours: 12,
		start_minutes: 0,
		end_date: new SvelteDate(),
		end_hours: 13,
		end_minutes: 0
	};
	let form = $state<EventForm>({
		calendar_id:
			calendars.activeEvent && calendars.activeEvent.calendar_id
				? parseInt(calendars.activeEvent.calendar_id)
				: 0,
		title: calendars.activeEvent ? calendars.activeEvent.title : '',
		description: calendars.activeEvent ? calendars.activeEvent.description : '',
		location: calendars.activeEvent ? calendars.activeEvent.location : '',
		is_all_day: calendars.activeEvent ? calendars.activeEvent.is_all_day : false,
		is_recurring: calendars.activeEvent ? calendars.activeEvent.is_recurring : false,
		recurrence_rule: calendars.activeEvent ? calendars.activeEvent.recurrence_rule : null,
		recurrence_end: calendars.activeEvent ? calendars.activeEvent.recurrence_end : null,
		start_date: getStartDate(),
		start_hours: calendars.activeEvent ? calendars.activeEvent.start_date.getHours() : 12,
		start_minutes: calendars.activeEvent ? calendars.activeEvent.start_date.getMinutes() : 0,
		end_date: getEndDate(),
		end_hours: calendars.activeEvent ? calendars.activeEvent.end_date.getHours() : 13,
		end_minutes: calendars.activeEvent ? calendars.activeEvent.end_date.getMinutes() : 0
	});
	let titleInput = $state<HTMLInputElement | null>(null);
	let showRecurrenceModal = $state<'edit' | 'delete' | null>(null);

	function isRecurring(): boolean {
		return (
			calendars.activeEvent?.is_recurring &&
			calendars.activeEvent?.original_start_date !== null
		);
	}

	function getStartDate(): SvelteDate {
		if (calendars.activeEvent) return new SvelteDate(calendars.activeEvent.start_date);
		if (calendars.selectedDate) return new SvelteDate(calendars.selectedDate);
		return new SvelteDate();
	}

	function getEndDate(): SvelteDate {
		if (calendars.activeEvent) return new SvelteDate(calendars.activeEvent.end_date);
		if (calendars.selectedDate) return new SvelteDate(calendars.selectedDate);
		return new SvelteDate();
	}

	function buildRequest(): UpdateEventRequest {
		if (form.is_all_day) {
			form.start_date.setHours(0);
			form.start_date.setMinutes(0);
			form.end_date.setHours(0);
			form.end_date.setMinutes(0);
		} else {
			form.start_date.setHours(form.start_hours);
			form.start_date.setMinutes(form.start_minutes);
			form.end_date.setHours(form.end_hours);
			form.end_date.setMinutes(form.end_minutes);
		}

		return {
			...form,
			start_date: formatFloatingDate(form.start_date),
			end_date: formatFloatingDate(form.end_date),
			recurrence_rule: form.is_recurring ? form.recurrence_rule : null,
			recurrence_end: form.recurrence_end ? formatFloatingDate(form.recurrence_end) : null,
			etag: calendars.activeEvent ? calendars.activeEvent.etag : null
		} as UpdateEventRequest;
	}

	async function onsubmit(): Promise<void> {
		if (isRecurring()) {
			showRecurrenceModal = 'edit';
			return;
		}
		await doUpdate(false);
	}

	async function onDelete(): Promise<void> {
		if (isRecurring()) {
			showRecurrenceModal = 'delete';
			return;
		}
		await doDelete(false);
	}

	async function doUpdate(thisOccurrenceOnly: boolean): Promise<void> {
		loadingIndicator.start();
		const request = buildRequest();

		const ok = thisOccurrenceOnly
			? await calendars.updateOccurrence(
					calendars.activeEvent!,
					request,
					calendars.activeEvent!.original_start_date!
				)
			: calendars.activeEvent
				? await calendars.updateEvent(calendars.activeEvent, request)
				: await calendars.createEvent(request);

		loadingIndicator.stop();
		if (ok) {
			form = { ...emptyForm };
			calendars.hideSidebar();
		} else {
			notifications.error(ts.get.calendar.entry_create_error);
		}
	}

	async function doDelete(thisOccurrenceOnly: boolean): Promise<void> {
		loadingIndicator.start();

		if (thisOccurrenceOnly) {
			await calendars.deleteOccurrence(
				calendars.activeEvent!,
				calendars.activeEvent!.original_start_date!
			);
		} else {
			await calendars.deleteEvent(calendars.activeEvent!);
		}

		loadingIndicator.stop();
		calendars.hideSidebar();
	}
</script>

<SlidingSideBar
	onClose={() => {
		calendars.hideSidebar();
	}}
	title={calendars.activeEvent ? ts.get.calendar.edit_entry : ts.get.calendar.create_entry}
>
	<div class="flex w-full flex-col items-center gap-2 lg:min-w-80">
		<ChooseCalendar bind:calendar={form.calendar_id} availableCalendars={calendars.calendars} />
		<TextInput
			bind:input={titleInput}
			bind:value={form.title}
			placeholder={ts.get.calendar.title}
		/>
		<div class="flex gap-6">
			<Toggle
				label={ts.get.calendar.is_all_day}
				bind:checked={form.is_all_day}
				onchange={() => {}}
			/>
			<Toggle
				label={ts.get.calendar.is_recurring}
				bind:checked={form.is_recurring}
				onchange={() => {}}
			/>
		</div>
		{#if form.start_date}
			<div class="flex w-full gap-2">
				<SvelteDateInput bind:date={form.start_date} />
				{#if !form.is_all_day}
					<TimePickerTest
						bind:hours={form.start_hours}
						bind:minutes={form.start_minutes}
					/>
				{/if}
			</div>
		{/if}
		{#if form.end_date}
			<div class="flex w-full gap-2">
				<SvelteDateInput bind:date={form.end_date} />
				{#if !form.is_all_day}
					<TimePickerTest bind:hours={form.end_hours} bind:minutes={form.end_minutes} />
				{/if}
			</div>
		{/if}
		{#if form.is_recurring}
			<ChooseRecurrenceRule
				bind:recurrenceRule={form.recurrence_rule}
				startDate={form.start_date}
			/>
		{/if}
		<TextInput bind:value={form.description} placeholder={ts.get.calendar.description} />
		<TextInput bind:value={form.location} placeholder={ts.get.calendar.location} />
		<div
			class="mt-8 flex w-full flex-row items-center"
			class:justify-between={calendars.activeEvent}
			class:justify-end={!calendars.activeEvent}
		>
			{#if calendars.activeEvent}
				<Button title={ts.get.calendar.delete_entry} onclick={onDelete} type="error" />
			{/if}
			<Button title={ts.get.layout.save} onclick={onsubmit} />
		</div>
	</div>
</SlidingSideBar>

{#if showRecurrenceModal}
	<RecurrenceActionModal
		action={showRecurrenceModal}
		onThisOccurrence={() => (showRecurrenceModal === 'edit' ? doUpdate(true) : doDelete(true))}
		onAllOccurrences={() =>
			showRecurrenceModal === 'edit' ? doUpdate(false) : doDelete(false)}
		onCancel={() => (showRecurrenceModal = null)}
	/>
{/if}
