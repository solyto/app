import type {
	FeedSubscription,
	FeedItem,
	CreateFeedSubscriptionRequest,
	UpdateFeedSubscriptionRequest,
	FeedTestItem,
	FeedEntrySize,
	Feed,
	FriendFeed
} from '$lib/types/feedSubscription';
import { getContext, setContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import { SvelteDate } from 'svelte/reactivity';
import { browser } from '$app/environment';

export class Feeds {
	loaded = $state<boolean>(false);
	feeds = $state<FeedSubscription[]>([]);
	activeFeed = $state<FeedSubscription | null>(null);
	items = $state<FeedItem[]>([]);
	filteredItems = $state<FeedItem[]>([]);
	modalOpen = $state<boolean>(false);
	browseOpen = $state<boolean>(false);
	view = $state<FeedEntrySize>('compact');
	inLibrary = $state<string[]>([]);
	auth = getAuth();
	apiService: ApiService;

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());
		this.loadView();
	}

	loadView(): void {
		if (!browser) return;
		const stored = localStorage.getItem('feeds_entry_size');
		if (stored && ['compact', 'comfortable', 'card'].includes(stored)) {
			this.view = stored as FeedEntrySize;
		}
	}

	changeView(size: FeedEntrySize): void {
		this.view = size;
		if (browser) localStorage.setItem('feeds_entry_size', size);
	}

	async load(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.feeds.list);

		if (res) {
			this.feeds = res.data as FeedSubscription[];
			const item_res = await this.apiService.list(apiRoutes.feeds.listItems);

			if (item_res) {
				this.items = item_res.data as FeedItem[];
			}

			this.loaded = true;
			this.filter();
			this.sort();
			this.loadInLibrary();
		}
	}

	filter(): void {
		if (!this.activeFeed) {
			this.filteredItems = [...this.items];
			return;
		}

		this.filteredItems = this.items.filter((item) => item.feed_id === this.activeFeed?.feed_id);
	}

	sort(): void {
		this.filteredItems = [...this.filteredItems].sort(
			(a, b) =>
				new SvelteDate(b.published_at).getTime() - new SvelteDate(a.published_at).getTime()
		);
	}

	selectFeed(feed: FeedSubscription | null): void {
		this.activeFeed = feed;
		this.filter();
		this.sort();
	}

	getFeedCount(feed: FeedSubscription): number {
		return this.items.filter((item) => item.feed_id === feed.feed_id).length;
	}

	saveToLibrary(feed: FeedSubscription): void {
		if (this.inLibrary.includes(feed.id)) {
			this.inLibrary = this.inLibrary.filter((id) => id !== feed.id);
		} else {
			this.inLibrary.push(feed.id);
		}

		this.storeInLibrary();
	}

	unsaveToLibrary(feed: FeedSubscription): void {
		this.inLibrary = this.inLibrary.filter((id) => id !== feed.id);
		this.storeInLibrary();
	}

	loadInLibrary(): void {
		if (!browser) return;

		const inLibrary = localStorage.getItem('feeds_in_library')?.split(',');
		if (inLibrary) this.inLibrary = inLibrary;
	}

	isInLibrary(feedId: string): boolean {
		return this.inLibrary.includes(feedId);
	}

	storeInLibrary(): void {
		if (browser) localStorage.setItem('feeds_in_library', this.inLibrary.join(','));
	}

	async create(request: CreateFeedSubscriptionRequest): Promise<boolean> {
		const res = await this.apiService.create(apiRoutes.feeds.create, request);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async subscribe(request: CreateFeedSubscriptionRequest): Promise<{ ok: boolean; duplicate: boolean }> {
		const res = await this.apiService.createWithStatus(apiRoutes.feeds.create, request);
		if (res.ok) await this.load();
		return { ok: res.ok, duplicate: res.status === 409 };
	}

	async update(feed: FeedSubscription, request: UpdateFeedSubscriptionRequest): Promise<boolean> {
		const res = await this.apiService.update(apiRoutes.feeds.update, feed.id, request);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async delete(feed: FeedSubscription): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.feeds.delete, feed.id);
		if (res) {
			this.selectFeed(null);
			await this.load();
			return Promise.resolve(true);
		}

		return Promise.resolve(false);
	}

	async testFeed(url: string): Promise<FeedTestItem[] | null> {
		const res = await this.apiService.post(apiRoutes.feeds.testFeed, { url });
		if (res) {
			return res.data as FeedTestItem[];
		}
		return null;
	}

	async loadAvailableFeeds(offset: number = 0): Promise<Feed[]> {
		const res = await this.apiService.list(`${apiRoutes.feeds.available}?offset=${offset}`);
		return res ? (res.data as Feed[]) : [];
	}

	async searchFeeds(query: string): Promise<Feed[]> {
		const res = await this.apiService.list(
			`${apiRoutes.feeds.search}?search=${encodeURIComponent(query)}`
		);
		return res ? (res.data as Feed[]) : [];
	}

	async loadFriendFeeds(): Promise<FriendFeed[]> {
		const res = await this.apiService.list(apiRoutes.feeds.friendFeeds);
		return res ? (res.data as FriendFeed[]) : [];
	}
}

const FEEDS_KEY = Symbol('SOLYTO_FEEDS');

export function setFeeds(): Feeds {
	return setContext(FEEDS_KEY, new Feeds());
}

export function getFeeds(): Feeds {
	return getContext<Feeds>(FEEDS_KEY);
}
