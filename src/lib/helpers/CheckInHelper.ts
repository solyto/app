import type { CheckInTracker } from '$lib/types/check_in';
import type { Goal } from '$lib/types/goal';
import type { GoalProgress } from '$lib/services/CheckInTrackerService';
import type { CheckInRecords } from '$lib/types/translation';

export function getScoreColor(value: number): string {
	if (value >= 4) return 'bg-c-success';
	if (value >= 3) return 'bg-c-primary';
	if (value >= 2) return 'bg-c-warning';
	if (value >= 1.5) return 'bg-c-action';
	return 'bg-c-danger';
}

export function trackerLabel(tracker: CheckInTracker, texts: CheckInRecords): string {
	return tracker.key !== null ? texts[tracker.key] : (tracker.name ?? '');
}

export function goalProgressText(goal: Goal, tracker: CheckInTracker, progress: GoalProgress, texts: CheckInRecords): string {
	const format = (n: number) => (tracker.type === 'scale' ? n.toFixed(1) : String(n));
	const current = progress.current === null ? '–' : format(progress.current);
	const target = `${goal.comparison === 'at_most' ? '≤ ' : ''}${format(goal.target)}`;
	const period = { day: texts.goal_today, week: texts.goal_this_week, month: texts.goal_this_month }[goal.period];

	return `${current} / ${target} ${period}`;
}

export interface GoalLine {
	text: string;
	met: boolean;
}
