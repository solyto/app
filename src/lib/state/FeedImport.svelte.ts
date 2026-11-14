import type { FeedImportState } from '$lib/types/feed';
import { getContext, setContext } from 'svelte';
import { getAuth, type Auth } from '$lib/state/Auth.svelte';
import { getFeeds, type Feeds } from '$lib/state/Feeds.svelte';
import ApiService, { RateLimitedError } from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';

export interface FeedImportResponse {
	ok: boolean;
	status: number;
}

export class FeedImport {
	modalOpen = $state<boolean>(false);
	state = $state<FeedImportState | null>(null);

	auth: Auth;
	apiService: ApiService;
	feeds: Feeds;

	constructor(
		auth: Auth = getAuth(),
		apiService: ApiService = auth.apiService,
		feeds: Feeds = getFeeds()
	) {
		this.auth = auth;
		this.apiService = apiService;
		this.feeds = feeds;
	}

	async upload(file: File): Promise<FeedImportResponse> {
		const body = new FormData();
		body.append('file', file);

		try {
			const res = await this.apiService.postWithStatus(apiRoutes.feeds.importStart, body);
			if (res.ok) this.state = res.data.data as FeedImportState;
			return { ok: res.ok, status: res.status };
		} catch (error) {
			if (!(error instanceof RateLimitedError)) throw error;
			return { ok: false, status: 429 };
		}
	}

	async select(urls: string[]): Promise<FeedImportResponse> {
		const res = await this.apiService.postWithStatus(apiRoutes.feeds.importSelect, { urls });
		if (res.ok) this.state = res.data.data as FeedImportState;
		return { ok: res.ok, status: res.status };
	}

	async refresh(): Promise<boolean> {
		const res = await this.apiService.get(apiRoutes.feeds.importState, null);
		if (!res) return false;

		const previousStage = this.state?.stage ?? null;
		this.state = res.data as FeedImportState;

		if (previousStage === 'running' && this.state.stage === 'finished') await this.feeds.load();

		return true;
	}

	reset(): void {
		this.state = null;
	}
}

const FEED_IMPORT_KEY = Symbol('SOLYTO_FEED_IMPORT');

export function setFeedImport(): FeedImport {
	return setContext(FEED_IMPORT_KEY, new FeedImport());
}

export function getFeedImport(): FeedImport {
	return getContext<FeedImport>(FEED_IMPORT_KEY);
}
