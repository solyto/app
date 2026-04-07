<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getCalendars } from '$lib/state/Calendars.svelte.js';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte.js';
	import type { Calendar } from '$lib/types/calendar.js';
	import IconCheck from '@lucide/svelte/icons/check';
	import IconX from '@lucide/svelte/icons/x';
	import IconCalendar from '@lucide/svelte/icons/calendar';

	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const calendars = getCalendars();
	const notifications = getUiNotifications();

	let { calendar } = $props<{ calendar: Calendar }>();

	let processing = $state<boolean>(false);

	async function accept(): Promise<void> {
		if (!calendar.share_token) return;

		processing = true;
		loadingIndicator.start();

		const success = await calendars.acceptInvite(calendar.share_token);

		if (success) {
			notifications.add({
				type: 'success',
				message: ts.get.calendar.invite_accepted
			});
		}

		loadingIndicator.stop();
		processing = false;
	}

	async function decline(): Promise<void> {
		if (!calendar.share_token) return;

		processing = true;
		loadingIndicator.start();

		const success = await calendars.declineInvite(calendar.share_token);

		if (success) {
			notifications.add({
				type: 'success',
				message: ts.get.calendar.invite_declined
			});
		}

		loadingIndicator.stop();
		processing = false;
	}
</script>

<div
	class="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
>
	<div
		class="flex size-8 items-center justify-center rounded-full"
		style="background-color: {calendar.color}20"
	>
		<IconCalendar class="size-4" style="color: {calendar.color}" />
	</div>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium">{calendar.name}</p>
		{#if calendar.share_owner}
			<p class="text-xs text-c-neutral-5 dark:text-c-neutral-4">
				{ts.get.calendar.shared_by.replace('%s', calendar.share_owner)}
			</p>
		{/if}
	</div>
	<div class="flex gap-2">
		<button
			class="rounded-full bg-green-100 p-2 text-green-600 transition-colors hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
			onclick={accept}
			disabled={processing}
			title={ts.get.calendar.accept_invite}
		>
			<IconCheck class="size-4" />
		</button>
		<button
			class="rounded-full bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
			onclick={decline}
			disabled={processing}
			title={ts.get.calendar.decline_invite}
		>
			<IconX class="size-4" />
		</button>
	</div>
</div>
