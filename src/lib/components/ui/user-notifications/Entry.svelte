<script lang="ts">
	import type { UserNotification, UserNotificationType } from '$lib/types/user_notification';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { getUserNotifications } from '$lib/state/UserNotifications.svelte.js';

	const ts = getTranslation();
	const userNotifications = getUserNotifications();

	let { notification, select, onClose } = $props<{
		notification: UserNotification;
		select: (slug: string) => void;
		onClose: () => void;
	}>();

	function goTo(notification: UserNotification): void {
		onClose();
		const slug = userNotifications.getPageSlug(notification.type as UserNotificationType);
		select(slug);
	}

	let notificationType = $derived(
		notification.type === 'App\\Shared\\Notifications\\ExportReadyNotification'
			? 'export_ready'
			: notification.type
	);

	function getTitle(): string {
		const n = ts.get.notifications;
		if (notificationType === 'friend_request') return n.friend_request_title;
		if (notificationType === 'music_release') return n.music_release_title;
		if (notificationType === 'book_release') return n.book_release_title;
		if (notificationType === 'calendar_share') return n.calendar_share_title;
		if (notificationType === 'dev_request_comment') return n.dev_request_comment_title;
		if (notificationType === 'daily_check_in_reminder') return n.daily_check_in_reminder_title;
		if (notificationType === 'daily_day_reminder') return n.daily_day_reminder_title;
		if (notificationType === 'export_ready') return n.export_ready_title;
		return '';
	}

	function getMessage(): string {
		const n = ts.get.notifications;
		if (notificationType === 'friend_request')
			return n.friend_request_message.replace('%s', notification.data.name);
		if (notificationType === 'music_release')
			return n.music_release_message.replace(
				'%s',
				notification.data.artist + ' - ' + notification.data.title
			);
		if (notificationType === 'book_release')
			return n.book_release_message.replace(
				'%s',
				notification.data.author + ' - ' + notification.data.title
			);
		if (notificationType === 'calendar_share')
			return n.calendar_share_message
				.replace('%1', notification.data.sender_name)
				.replace('%2', notification.data.calendar_name);
		if (notificationType === 'dev_request_comment')
			return n.dev_request_comment_message
				.replace('%1', notification.data.commenter_name)
				.replace('%2', notification.data.dev_request_title);
		if (notificationType === 'daily_check_in_reminder')
			return n.daily_check_in_reminder_message;
		if (notificationType === 'daily_day_reminder')
			return n.daily_day_reminder_message
				.replace('%1', notification.data.todo_count)
				.replace('%2', notification.data.event_count);
		if (notificationType === 'export_ready') return n.export_ready_message;
		return '';
	}
</script>

<a
	class="relative flex w-full cursor-pointer flex-col gap-1 px-4 py-2 hover:bg-c-neutral dark:hover:bg-s-dark-2"
	href={userNotifications.getLink(notification)}
	onclick={() => goTo(notification)}
>
	<div class="flex items-center gap-2">
		{#if !notification.read_at}
			<div class="size-2 rounded-full bg-c-btn-hover shadow-sm"></div>
		{/if}
		<span class="text-sm font-bold">{getTitle()}</span>
	</div>
	<p class="text-sm">
		{getMessage()}
	</p>
</a>
