import type { Todo, TodoCategory } from '$lib/types/todo';
import type { DevRequest } from '$lib/types/dev_request';
import type { Tag } from '$lib/types/tag';
import type { CheckInTracker, CheckInValue } from '$lib/types/check_in';
import type { Goal } from '$lib/types/goal';

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
