import type { CreateCheckInRequest, CheckIn, CheckInSettings, CheckInType, SportId } from '$lib/types/check_in';
import { ALL_CHECK_IN_TRACKERS, DEFAULT_SPORTS } from '$lib/types/check_in';
import { setContext, getContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import { getUrlFormat } from '$lib/helpers/DateHelper';
import { page } from '$app/state';
import { SvelteDate } from 'svelte/reactivity';

export class CheckInData {
	loaded = $state<boolean>(false);
	data = $state<CheckIn[]>([]);
	settings = $state<CheckInSettings>({ enabledTrackers: [...ALL_CHECK_IN_TRACKERS], selectedSports: [...DEFAULT_SPORTS] });
	auth = getAuth();
	apiService: ApiService;
	selectedDate = $derived(page.params.date);

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());
	}

	async load(): Promise<void> {
		const [dataRes, settingsRes] = await Promise.all([
			this.apiService.list(apiRoutes.checkIn.list),
			this.apiService.get(apiRoutes.users.settings.updateCheckInSettings, null)
		]);

		if (dataRes) {
			this.loaded = true;
			this.data = dataRes.data as CheckIn[];
		}

		if (settingsRes) {
			const data = settingsRes.data as { enabled_trackers: CheckInType[]; selected_sports?: SportId[] };
			this.settings = {
				enabledTrackers: data.enabled_trackers,
				selectedSports: data.selected_sports ?? [...DEFAULT_SPORTS]
			};
		}
	}

	async save(request: CreateCheckInRequest): Promise<void> {
		const ok = await this.apiService.create(apiRoutes.checkIn.create, request);
		if (ok) await this.load();
	}

	async saveSettings(settings: CheckInSettings): Promise<void> {
		await this.apiService.put(apiRoutes.users.settings.updateCheckInSettings, {
			enabled_trackers: settings.enabledTrackers,
			selected_sports: settings.selectedSports
		});
		this.settings = settings;
	}

	get activeTrackers(): CheckInType[] {
		return ALL_CHECK_IN_TRACKERS.filter((t) => this.settings.enabledTrackers.includes(t));
	}

	getDayData(day?: string): CheckIn | null {
		if (!day)
			return (
				this.data.find((t) => t.date === getUrlFormat(new SvelteDate(this.selectedDate))) ??
				null
			);

		return this.data.find((t) => t.date === day) ?? null;
	}
}

const CHECK_IN_KEY = Symbol('SOLYTO_CHECK_IN');

export function setCheckInData(): CheckInData {
	return setContext(CHECK_IN_KEY, new CheckInData());
}

export function getCheckInData(): CheckInData {
	return getContext<CheckInData>(CHECK_IN_KEY);
}
