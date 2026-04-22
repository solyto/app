import { getContext, setContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import type { UserNotification, UserNotificationType } from '$lib/types/user_notification';
import { urls } from '$lib/config/urls';

export class UserNotifications {
	notifications = $state<UserNotification[]>([]);
	loaded = $state<boolean>(false);
	auth = getAuth();
	apiService: ApiService;

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());
	}

	async load(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.notifications.list);
		if (res) {
			this.notifications = res.data as UserNotification[];
			this.loaded = true;
		}
	}

	getLink(notification: UserNotification): string {
		const type = notification.type;
		if (type === 'friend_request') return urls.profile;
		if (type === 'music_release') return urls.musicLibrary + '?releases';
		if (type === 'book_release') return urls.bookLibrary + '?releases';
		if (type === 'dev_request_comment') return urls.devRequests;
		if (type === 'calendar_share') return urls.calendar;
		if (type === 'daily_check_in_reminder')
			return urls.checkInDate.replace('[date]', notification.data.date);
		if (type === 'daily_day_reminder') return urls.calendar;
		if (type === 'export_ready') return urls.settings;

		return '';
	}

	getPageSlug(type: UserNotificationType): string {
		if (type === 'friend_request') {
			return 'profile';
		}

		return '';
	}

	getUnread(): UserNotification[] {
		return this.notifications.filter((n) => !n.read_at);
	}

	async markRead(notification: UserNotification): Promise<void> {
		await this.apiService.update(apiRoutes.notifications.markRead, notification.id, {});
	}
}

const USER_NOTIFICATIONS_KEY = Symbol('SOLYTO_USER_NOTIFICATIONS');

export function setUserNotifications(): UserNotifications {
	return setContext(USER_NOTIFICATIONS_KEY, new UserNotifications());
}

export function getUserNotifications(): UserNotifications {
	return getContext<UserNotifications>(USER_NOTIFICATIONS_KEY);
}
