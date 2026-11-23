import type { Todo, TodoCategory } from '$lib/types/todo';
import type { DevRequest } from '$lib/types/dev_request';
import type { Tag } from '$lib/types/tag';
import type { CheckInTracker, CheckInValue } from '$lib/types/check_in';
import type { Goal } from '$lib/types/goal';
import type { Calendar, CalendarEvent, CalendarEventResponse } from '$lib/types/calendar';
import type { FeedImportEntry, FeedImportState, FeedItem, FeedSubscription } from '$lib/types/feed';

export function todo(overrides: Partial<Todo> = {}): Todo {
	return {
		id: '1',
		title: 'Test todo',
		description: '',
		link: null,
		priority: 'medium',
		status: 'pending',
		effort: null,
		progress: null,
		is_completed: false,
		due_at: '',
		category: null,
		tags: [],
		subtasks: [],
		relevance: null,
		recurrence_frequency: null,
		recurrence_interval: 1,
		recurrence_ends_at: null,
		parent_task_id: null,
		auto_generated: false,
		created_at: '',
		updated_at: '',
		completed_at: '',
		...overrides
	};
}

export function category(id: number, title = 'Category'): TodoCategory {
	return { id, title, created_at: '', updated_at: '' };
}

export function tag(id: number, name = 'tag'): Tag {
	return { id, name, color: '#000000', created_at: '', updated_at: '' };
}

export function devRequest(overrides: Partial<DevRequest> = {}): DevRequest {
	return {
		id: 1,
		type: 'bug',
		status: 'pending',
		priority: 2,
		title: 'Login fails',
		description: 'The login button does nothing',
		screenshot: '',
		url: '',
		created_at: '2026-10-01T10:00:00Z',
		updated_at: '2026-10-01T10:00:00Z',
		upvotes: 0,
		downvotes: 0,
		score: 0,
		user_vote: 'up',
		comment_count: 0,
		fixed_in_version: null,
		created_by_user_id: null,
		created_by_user: { id: '', name: 'Ada' },
		...overrides
	};
}

export function checkInTracker(overrides: Partial<CheckInTracker> = {}): CheckInTracker {
	return {
		id: 1,
		key: null,
		name: 'Meditated',
		type: 'yes_no',
		icon: null,
		position: 0,
		enabled: true,
		scored: false,
		...overrides
	};
}

export function checkInValue(trackerId: number, date: string, value: number): CheckInValue {
	return { tracker_id: trackerId, date, value };
}

export function goal(overrides: Partial<Goal> = {}): Goal {
	return {
		id: 1,
		source: 'check_in_tracker',
		check_in_tracker_id: 1,
		period: 'week',
		comparison: 'at_least',
		target: 3,
		notify_when_reached: false,
		progress: { current: null, met: false, period_start: '', period_end: '', history: [] },
		...overrides
	};
}

export function calendar(overrides: Partial<Calendar> = {}): Calendar {
	return {
		id: 1,
		name: 'Personal',
		color: '#fff',
		description: '',
		timezone: 'UTC',
		order: 0,
		is_shared: false,
		share_owner: null,
		invite_status: null,
		share_token: null,
		is_external: false,
		is_unavailable: false,
		is_credentials_rejected: false,
		...overrides
	};
}

export function calendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
	return {
		id: 1,
		uri: 'event-1',
		title: 'Event',
		description: '',
		location: '',
		start_date: new Date(2026, 7, 10, 10, 0),
		end_date: new Date(2026, 7, 10, 11, 0),
		is_all_day: false,
		is_recurring: false,
		recurrence_rule: null,
		recurrence_end: null,
		original_start_date: null,
		created_at: null,
		updated_at: null,
		calendar_id: 1,
		calendar_name: 'Personal',
		calendar_color: '#fff',
		etag: '',
		...overrides
	};
}

export function calendarEventResponse(overrides: Partial<CalendarEventResponse> = {}): CalendarEventResponse {
	return {
		id: 1,
		uri: 'event-1',
		title: 'Event',
		description: '',
		location: '',
		start_date: '2026-08-10T10:00:00Z',
		end_date: '2026-08-10T11:00:00Z',
		is_all_day: false,
		is_recurring: false,
		recurrence_rule: null,
		recurrence_end: null,
		original_start_date: null,
		created_at: null,
		updated_at: null,
		calendar_id: 1,
		calendar_name: 'Personal',
		calendar_color: '#fff',
		etag: '',
		...overrides
	};
}

export function feedSubscription(overrides: Partial<FeedSubscription> = {}): FeedSubscription {
	return {
		id: 'sub-1',
		feed_id: 'feed-1',
		title: 'My Feed',
		url: 'https://example.com/rss',
		whitelist: '',
		blacklist: '',
		created_at: '',
		updated_at: '',
		...overrides
	};
}

export function feedItem(overrides: Partial<FeedItem> = {}): FeedItem {
	return {
		id: 'item-1',
		title: 'An item',
		description: '',
		image_url: null,
		feed_id: 'feed-1',
		link: 'https://example.com/item-1',
		published_at: '2026-08-01T10:00:00Z',
		saved_link_id: null,
		...overrides
	};
}

export function feedImportEntry(overrides: Partial<FeedImportEntry> = {}): FeedImportEntry {
	return {
		url: 'https://a.test/feed',
		title: 'A feed',
		already_subscribed: false,
		status: null,
		...overrides
	};
}

export function feedImportState(overrides: Partial<FeedImportState> = {}): FeedImportState {
	return {
		stage: 'parsed',
		total: 0,
		processed: 0,
		feeds: [],
		...overrides
	};
}
