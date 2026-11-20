import type {
	CheckIn,
	CheckInAlertRequest,
	CheckInGoal,
	CheckInTracker,
	CheckInValue,
	CreateCheckInTrackerRequest,
	SportId,
	UpdateCheckInTrackerRequest
} from '$lib/types/check_in';
import { DEFAULT_SPORTS } from '$lib/types/check_in';
import { setContext, getContext } from 'svelte';
import { getAuth, type Auth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import CheckInTrackerService from '$lib/services/CheckInTrackerService';
import { apiRoutes } from '$lib/config/apiRoutes';
import { page } from '$app/state';

const trackerService = new CheckInTrackerService();

export interface HistoryMonth {
	year: number;
	month: number;
}

export class CheckInData {
	loaded = $state<boolean>(false);
	trackers = $state<CheckInTracker[]>([]);
	values = $state<CheckInValue[]>([]);
	selectedSports = $state<SportId[]>([...DEFAULT_SPORTS]);
	historyMonth = $state<HistoryMonth>({ year: new Date().getFullYear(), month: new Date().getMonth() });
	index = $derived(trackerService.index(this.values));
	activeTrackers = $derived(this.trackers.filter((tracker) => tracker.enabled));
	ratingTrackers = $derived(this.activeTrackers.filter((tracker) => trackerService.isRating(tracker)));
	logTrackers = $derived(this.activeTrackers.filter((tracker) => trackerService.isLog(tracker)));
	scoredTrackers = $derived(trackerService.scored(this.trackers));
	selectedDate = $derived(page.params.date);
	auth: Auth;
	apiService: ApiService;
	trackerService: CheckInTrackerService = trackerService;

	constructor(auth: Auth = getAuth(), apiService: ApiService = auth.apiService) {
		this.auth = auth;
		this.apiService = apiService;
	}

	async load(): Promise<void> {
		const [trackersRes, valuesRes, settingsRes] = await Promise.all([
			this.apiService.list(apiRoutes.checkIn.trackers),
			this.apiService.list(apiRoutes.checkIn.values),
			this.apiService.get(apiRoutes.users.settings.updateCheckInSettings, null)
		]);

		if (trackersRes && valuesRes) {
			this.trackers = trackersRes.data as CheckInTracker[];
			this.values = valuesRes.data as CheckInValue[];
			this.loaded = true;
		}

		if (settingsRes) {
			const data = settingsRes.data as { selected_sports?: SportId[] };
			this.selectedSports = data.selected_sports ?? [...DEFAULT_SPORTS];
		}
	}

	getValue(tracker: CheckInTracker, date: string): number | null {
		return this.trackerService.value(this.index, tracker.id, date);
	}

	// The built-in trackers of a day in the one-row-per-day shape the text summaries read.
	getDayData(day?: string): CheckIn | null {
		const date = day ?? this.selectedDate;
		if (!date) return null;

		return this.trackerService.builtInDay(this.index, this.trackers, date);
	}

	async setValue(tracker: CheckInTracker, date: string, value: number | null): Promise<boolean> {
		const previous = this.values;
		this.values = [
			...this.values.filter((v) => !(v.tracker_id === tracker.id && v.date === date)),
			...(value === null ? [] : [{ tracker_id: tracker.id, date, value }])
		];

		const ok = await this.apiService.put(apiRoutes.checkIn.values, { tracker_id: tracker.id, date, value });
		if (!ok) {
			this.values = previous;
			return false;
		}

		this.auth.widgetBridge.notifyChanged();
		return true;
	}

	async saveDay(date: string, changes: Map<CheckInTracker, number | null>): Promise<boolean> {
		const results = await Promise.all([...changes].map(([tracker, value]) => this.setValue(tracker, date, value)));
		return results.every(Boolean);
	}

	async saveSelectedSports(sports: SportId[]): Promise<boolean> {
		const enabledBuiltIns = this.trackers.filter((t) => t.key !== null && t.enabled).map((t) => t.key);
		const ok = await this.apiService.put(apiRoutes.users.settings.updateCheckInSettings, {
			enabled_trackers: enabledBuiltIns,
			selected_sports: sports
		});
		if (!ok) return false;

		this.selectedSports = sports;
		this.auth.widgetBridge.notifyChanged();
		return true;
	}

	async createTracker(request: CreateCheckInTrackerRequest): Promise<CheckInTracker | null> {
		const res = await this.apiService.create(apiRoutes.checkIn.trackers, request);
		if (!res) return null;

		await this.reloadTrackers();
		return this.trackers.find((tracker) => tracker.id === (res.data as CheckInTracker).id) ?? null;
	}

	async updateTracker(tracker: CheckInTracker, request: UpdateCheckInTrackerRequest): Promise<boolean> {
		return this.writeAndReload(this.apiService.put(apiRoutes.checkIn.tracker.replace('%d', String(tracker.id)), request));
	}

	async deleteTracker(tracker: CheckInTracker): Promise<boolean> {
		const ok = await this.writeAndReload(this.apiService.delete(apiRoutes.checkIn.tracker, tracker.id));
		if (ok) this.values = this.values.filter((value) => value.tracker_id !== tracker.id);
		return ok;
	}

	async moveTracker(tracker: CheckInTracker, offset: -1 | 1): Promise<boolean> {
		const ids = this.trackers.map((t) => t.id);
		const from = ids.indexOf(tracker.id);
		const to = from + offset;
		if (from === -1 || to < 0 || to >= ids.length) return false;

		[ids[from], ids[to]] = [ids[to], ids[from]];
		return this.writeAndReload(this.apiService.put(apiRoutes.checkIn.trackerOrder, { ids }));
	}

	async setGoal(tracker: CheckInTracker, goal: CheckInGoal): Promise<boolean> {
		return this.writeAndReload(this.apiService.put(apiRoutes.checkIn.trackerGoal.replace('%d', String(tracker.id)), goal));
	}

	async deleteGoal(tracker: CheckInTracker): Promise<boolean> {
		return this.writeAndReload(this.apiService.delete(apiRoutes.checkIn.trackerGoal, tracker.id));
	}

	async addAlert(tracker: CheckInTracker, request: CheckInAlertRequest): Promise<boolean> {
		return this.writeAndReload(
			this.apiService.create(apiRoutes.checkIn.trackerAlerts.replace('%d', String(tracker.id)), request).then(Boolean)
		);
	}

	async updateAlert(alertId: number, request: CheckInAlertRequest): Promise<boolean> {
		return this.writeAndReload(this.apiService.put(apiRoutes.checkIn.alert.replace('%d', String(alertId)), request));
	}

	async deleteAlert(alertId: number): Promise<boolean> {
		return this.writeAndReload(this.apiService.delete(apiRoutes.checkIn.alert, alertId));
	}

	prevMonth(): void {
		const d = new Date(this.historyMonth.year, this.historyMonth.month - 1, 1);
		this.historyMonth = { year: d.getFullYear(), month: d.getMonth() };
	}

	nextMonth(): void {
		const d = new Date(this.historyMonth.year, this.historyMonth.month + 1, 1);
		this.historyMonth = { year: d.getFullYear(), month: d.getMonth() };
	}

	isCurrentMonth(): boolean {
		const now = new Date();
		return this.historyMonth.year === now.getFullYear() && this.historyMonth.month === now.getMonth();
	}

	private async writeAndReload(write: Promise<boolean>): Promise<boolean> {
		const ok = await write;
		if (!ok) return false;

		await this.reloadTrackers();
		this.auth.widgetBridge.notifyChanged();
		return true;
	}

	private async reloadTrackers(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.checkIn.trackers);
		if (res) this.trackers = res.data as CheckInTracker[];
	}
}

const CHECK_IN_KEY = Symbol('SOLYTO_CHECK_IN');

export function setCheckInData(): CheckInData {
	return setContext(CHECK_IN_KEY, new CheckInData());
}

export function getCheckInData(): CheckInData {
	return getContext<CheckInData>(CHECK_IN_KEY);
}
