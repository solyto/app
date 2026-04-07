import { getContext, setContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import type { FeatureType } from '$lib/types/feature';

export class Features {
	loaded = $state<boolean>(false);
	auth = getAuth();
	features = $state<Record<FeatureType, boolean>>({
		calendar: true,
		todos: true,
		notes: true,
		libraries: true,
		contacts: true,
		checkIn: true,
		finances: true,
		feeds: true,
		clipboard: true,
		dev_requests: true,
		timeTracking: true
	});
	apiService: ApiService;

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());
		const ready = this.load();
	}

	async load(): Promise<void> {
		if (this.auth.user?.settings?.navigation !== undefined) {
			const loadedFeatures: Record<FeatureType, boolean> = JSON.parse(
				this.auth.user.settings.navigation
			);

			if (!loadedFeatures) {
				await this.save();
				return;
			}

			for (const type of Object.keys(this.features)) {
				if (!(type in loadedFeatures)) {
					loadedFeatures[type as FeatureType] = true;
				}
			}

			this.features = loadedFeatures;
		}
	}

	async save(): Promise<void> {
		const features = JSON.stringify(this.features);
		this.auth.user.settings.navigation = features;
		await this.auth.updateNavigation(features);
		await this.auth.loadAdditionalData();
	}
}

const FEATURES_KEY = Symbol('SOLYTO_FEATURES');

export function setFeatures(): Features {
	return setContext(FEATURES_KEY, new Features());
}

export function getFeatures(): Features {
	return getContext<Features>(FEATURES_KEY);
}
