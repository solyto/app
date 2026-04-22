export type UserNotificationType =
	| 'friend_request'
	| 'music_release'
	| 'book_release'
	| 'dev_request_comment'
	| 'calendar_share'
	| 'daily_check_in_reminder'
	| 'daily_day_reminder'
	| 'export_ready'
	| 'other';

export interface UserNotification {
	id: string;
	type: UserNotificationType;
	data: Record<string, string>;
	read_at: string;
	created_at: string;
	updated_at: string;
}
