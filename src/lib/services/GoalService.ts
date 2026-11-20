import type { CheckInTrackerType } from '$lib/types/check_in';
import { MAX_CHECK_IN_COUNT } from '$lib/types/check_in';
import type { Goal, GoalPeriod } from '$lib/types/goal';
import { parseUrlFormat } from '$lib/helpers/DateHelper';

export interface TargetBounds {
	min: number;
	max: number;
	step: number;
}

// Mirrors the API's checks so the form can say what fits before saving.
export default class GoalService {
	// Yes/no and sports count days, which only make sense over a week or a month.
	countsDays(type: CheckInTrackerType): boolean {
		return type === 'yes_no' || type === 'sport';
	}

	periods(type: CheckInTrackerType): GoalPeriod[] {
		return this.countsDays(type) ? ['week', 'month'] : ['day', 'week', 'month'];
	}

	bounds(type: CheckInTrackerType, period: GoalPeriod): TargetBounds {
		if (type === 'scale') return { min: 1, max: 5, step: 0.1 };
		if (this.countsDays(type)) return { min: 0, max: period === 'week' ? 7 : 31, step: 1 };
		return { min: 0, max: MAX_CHECK_IN_COUNT, step: 1 };
	}

	isValidTarget(type: CheckInTrackerType, period: GoalPeriod, target: number | null): boolean {
		if (target === null || !this.periods(type).includes(period)) return false;

		const { min, max } = this.bounds(type, period);
		return target >= min && target <= max && (type === 'scale' || Number.isInteger(target));
	}

	// How far the bar is filled: the share of the target reached so far.
	ratio(goal: Goal): number {
		const current = goal.progress.current ?? 0;
		if (goal.target <= 0) return current > 0 ? 1 : 0;
		return Math.min(1, Math.max(0, current / goal.target));
	}

	// Days left in the running period, today included; null for daily goals.
	daysLeft(goal: Goal, today: Date): number | null {
		if (goal.period === 'day') return null;

		const end = parseUrlFormat(goal.progress.period_end);
		if (end === null) return null;

		const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
	}
}
