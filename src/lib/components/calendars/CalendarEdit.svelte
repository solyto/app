<script lang="ts">
	import { getCalendars } from '$lib/state/Calendars.svelte';
	import { getCalendarSharing } from '$lib/state/CalendarSharing.svelte';
	import { getExternalCalendars } from '$lib/state/ExternalCalendars.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import ColorPicker from 'svelte-awesome-color-picker';
	import type { Calendar, UpdateCalendarRequest } from '$lib/types/calendar';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { clickOutside } from '$lib/helpers/ClickHelper';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';
	import GhostIconButton from '$lib/components/ui/buttons/GhostIconButton.svelte';
	import IconShare2 from '@lucide/svelte/icons/share-2';
	import IconEye from '@lucide/svelte/icons/eye';
	import IconEyeOff from '@lucide/svelte/icons/eye-off';
	import IconKeyRound from '@lucide/svelte/icons/key-round';

	const calendars = getCalendars();
	const calendarSharing = getCalendarSharing();
	const externalCalendars = getExternalCalendars();
	const loadingIndicator = getLoadingIndicator();
	const ts = getTranslation();
	const notifications = getUiNotifications();

	let { calendar }: { calendar: Calendar } = $props();

	let hex = $state<string>(calendar.color !== null ? calendar.color : 'var(--color-c-neutral-2)');

	async function onColorChange(): Promise<void> {
		if (hex === calendar.color) return;
		if (hex === null) return;

		loadingIndicator.start();
		const request: UpdateCalendarRequest = { color: hex };
		await calendars.updateCalendarColor(calendar, request);
		loadingIndicator.stop();
	}

	function onDelete(): void {
		calendars.selectedCalendar = calendar;
		calendars.deletionModal = true;
	}

	function onShare(): void {
		calendarSharing.openShareModal(calendar);
	}

	async function onUnsubscribe(): Promise<void> {
		loadingIndicator.start();
		const success = await calendarSharing.unsubscribeFromCalendar(calendar.id);
		if (success) {
			notifications.add({
				type: 'success',
				message: ts.get.calendar.unsubscribed
			});
		}
		loadingIndicator.stop();
	}

	function onChangePassword(): void {
		externalCalendars.changePasswordForCalendar(calendar.id);
	}
</script>

<div class="flex w-full min-w-0 items-center gap-4">
	<div use:clickOutside={onColorChange}>
		<ColorPicker
			bind:hex
			position="responsive"
			nullable={false}
			label=""
			isTextInput={false}
			--cp-border-color="var(--color-c-neutral-2)"
		/>
	</div>
	<div class="flex flex-1 flex-col min-w-0">
		<span class="truncate text-md">{calendar.name}</span>
		{#if calendar.is_shared && calendar.share_owner}
			<span class="truncate text-xs text-c-neutral-4">{ts.get.calendar.shared_by.toLowerCase().replace('%s', calendar.share_owner)}</span>
		{:else if calendars.isCalendarCredentialsRejected(calendar.id)}
			<span class="truncate text-xs text-c-danger">{ts.get.calendar.external_credentials_rejected}</span>
		{:else if calendars.isCalendarUnavailable(calendar.id)}
			<span class="truncate text-xs text-c-danger">{ts.get.calendar.external_unavailable}</span>
		{:else if calendar.is_external}
			<span class="truncate text-xs text-c-neutral-4">{ts.get.calendar.external_calendar}</span>
		{/if}
	</div>
	<div class="lg:hidden">
		<button
			class="text-c-neutral-4"
			onclick={() => calendars.toggleCalendar(calendar.id)}
		>
			{#if calendars.isCalendarHidden(calendar.id)}
				<IconEyeOff class="size-4" />
			{:else}
				<IconEye class="size-4" />
			{/if}
		</button>
	</div>
	<div class="flex items-center">
		{#if !calendar.is_shared && calendar.invite_status === null}
			{#if calendars.isCalendarCredentialsRejected(calendar.id)}
				<GhostIconButton onclick={onChangePassword} label={ts.get.calendar.account_change_password} color="text-c-danger">
					<IconKeyRound class="size-4" />
				</GhostIconButton>
			{/if}
			{#if !calendar.is_external}
				<GhostIconButton onclick={onShare} label={ts.get.calendar.share_calendar}>
					<IconShare2 class="size-4" />
				</GhostIconButton>
			{/if}
			<InlineDeleteButton onClick={onDelete} />
		{:else if calendar.is_shared}
			<InlineDeleteButton onClick={onUnsubscribe} />
		{/if}
	</div>
</div>
