<script lang="ts">
	import { getCalendars } from '$lib/state/Calendars.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import ColorPicker from 'svelte-awesome-color-picker';
	import type { Calendar, UpdateCalendarRequest } from '$lib/types/calendar';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { clickOutside } from '$lib/helpers/ClickHelper';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';
	import IconShare2 from '@lucide/svelte/icons/share-2';
	import IconLogOut from '@lucide/svelte/icons/log-out';

	const calendars = getCalendars();
	const loadingIndicator = getLoadingIndicator();
	const ts = getTranslation();
	const notifications = getUiNotifications();

	let { calendar } = $props<{ calendar: Calendar }>();

	let hex = $state<string>(calendar.color !== null ? calendar.color : 'var(--color-c-neutral-2)');

	const isOwned = $derived(!calendar.is_shared && calendar.invite_status === null);

	async function onColorChange(): Promise<void> {
		if (hex === calendar.color) return;
		if (hex === null) return;

		loadingIndicator.start();
		const request: UpdateCalendarRequest = { color: hex };
		await calendars.updateCalendar(calendar, request);
		loadingIndicator.stop();
	}

	function onDelete(): void {
		calendars.selectedCalendar = calendar;
		calendars.deletionModal = true;
	}

	function onShare(): void {
		calendars.openShareModal(calendar);
	}

	async function onUnsubscribe(): Promise<void> {
		loadingIndicator.start();
		const success = await calendars.unsubscribeFromCalendar(calendar.id);
		if (success) {
			notifications.add({
				type: 'success',
				message: ts.get.calendar.unsubscribed
			});
		}
		loadingIndicator.stop();
	}

	const getDisplayName = () =>
		calendar.is_shared ? calendar.name + ' (' + calendar.share_owner + ')' : calendar.name;
</script>

<div class="flex items-center gap-4">
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
	<span class="flex-1 text-lg">{getDisplayName()}</span>
	<div class="flex items-center gap-2">
		{#if isOwned}
			<button
				class="cursor-pointer rounded-full p-2 text-c-neutral-4 transition-colors hover:bg-c-neutral-1 hover:text-c-primary dark:hover:bg-s-dark-3"
				onclick={onShare}
				title={ts.get.calendar.share_calendar}
			>
				<IconShare2 class="size-4" />
			</button>
			<InlineDeleteButton onClick={onDelete} />
		{:else if calendar.is_shared}
			<button
				class="cursor-pointer rounded-full p-2 text-c-neutral-4 transition-colors hover:bg-c-neutral-1 hover:text-c-danger dark:hover:bg-s-dark-3"
				onclick={onUnsubscribe}
				title={ts.get.calendar.unsubscribe}
			>
				<IconLogOut class="size-4" />
			</button>
		{/if}
	</div>
</div>
