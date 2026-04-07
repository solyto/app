<script lang="ts">
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getCalendars } from '$lib/state/Calendars.svelte.js';
	import { getAuth } from '$lib/state/Auth.svelte.js';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte.js';
	import { apiRoutes, API_USER_STORAGE_URL } from '$lib/config/apiRoutes.js';
	import ApiService from '$lib/services/ApiService.js';
	import type { Friend } from '$lib/types/friend.js';
	import type { Calendar } from '$lib/types/calendar.js';
	import IconUserPlus from '@lucide/svelte/icons/user-plus';
	import IconUsers from '@lucide/svelte/icons/users';
	import { onMount } from 'svelte';

	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const calendars = getCalendars();
	const auth = getAuth();
	const notifications = getUiNotifications();

	let { calendar, onClose } = $props<{ calendar: Calendar; onClose: () => void }>();

	let friends = $state<Friend[]>([]);
	let loaded = $state<boolean>(false);
	let sharing = $state<string | null>(null);

	const apiService = new ApiService(auth.getToken());

	onMount(async () => {
		const res = await apiService.list(apiRoutes.friends.list);
		if (res) {
			friends = res.data as Friend[];
		}
		loaded = true;
	});

	async function shareWithFriend(friend: Friend): Promise<void> {
		sharing = friend.user_id;
		loadingIndicator.start();

		const success = await calendars.shareCalendar(calendar.id, friend.user_id);

		if (success) {
			notifications.add({
				type: 'success',
				message: ts.get.calendar.share_success
			});
		} else {
			notifications.add({
				type: 'error',
				message: ts.get.calendar.share_error
			});
		}

		loadingIndicator.stop();
		sharing = null;

		if (success) {
			onClose();
		}
	}
</script>

<ContentModal title={ts.get.calendar.share_calendar} rounded="2xl" p="4" {onClose}>
	<div class="flex w-full min-w-80 flex-col gap-4">
		{#if !loaded}
			<div class="py-4 text-center text-c-neutral-5">{ts.get.widgets.loading}...</div>
		{:else if friends.length === 0}
			<div class="flex flex-col items-center gap-3 py-8 text-c-neutral-4">
				<IconUsers class="size-12" />
				<p class="text-sm">{ts.get.calendar.no_friends_to_share}</p>
			</div>
		{:else}
			<p class="text-sm text-c-neutral-5">{ts.get.calendar.share_with_friend}</p>
			<div class="flex max-h-80 flex-col gap-2 overflow-y-auto">
				{#each friends as friend (friend.user_id)}
					<button
						class="flex cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-c-neutral-1 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-s-dark-3"
						onclick={() => shareWithFriend(friend)}
						disabled={sharing !== null}
					>
						<div
							class="flex size-10 items-center justify-center rounded-full bg-c-neutral-2 dark:bg-s-dark-3"
						>
							{#if friend.profile_image_path}
								<img
									src={API_USER_STORAGE_URL + '/' + friend.profile_image_path}
									alt="Profile"
									class="h-full w-full rounded-full object-cover"
								/>
							{:else}
								<span class="font-medium text-c-neutral-5"
									>{friend.name[0].toUpperCase()}</span
								>
							{/if}
						</div>
						<span class="flex-1 font-medium">{friend.name}</span>
						{#if sharing === friend.user_id}
							<div
								class="size-5 animate-spin rounded-full border-2 border-c-primary border-t-transparent"
							></div>
						{:else}
							<IconUserPlus class="size-5 text-c-primary" />
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</ContentModal>
