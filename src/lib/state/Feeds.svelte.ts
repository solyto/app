import type {
	FeedSubscription,
	FeedItem,
	CreateFeedSubscriptionRequest,
	UpdateFeedSubscriptionRequest,
	FeedTestItem,
	FeedEntrySize,
	Feed,
	FriendFeed
} from '$lib/types/feed';
import { getContext, setContext } from 'svelte';
import { getAuth, type Auth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import LocalStorageService from '$lib/services/LocalStorageService';
import { apiRoutes } from '$lib/config/apiRoutes';
import type { ListResponse } from '$lib/types/api';
import type { CreateLinkRequest, Link } from '$lib/types/library_link';

export class Feeds {
	static readonly LS_VIEW_KEY: string = 'feeds_entry_size';
	static readonly LS_LEGACY_IN_LIBRARY_KEY: string = 'feeds_in_library';
	static readonly ITEMS_PER_PAGE = 50;

	loaded = $state<boolean>(false);
	feeds = $state<FeedSubscription[]>([]);
	activeFeed = $state<FeedSubscription | null>(null);
	items = $state<FeedItem[]>([]);
	filteredItems = $state<FeedItem[]>([]);
	hasMore = $state<boolean>(true);
	loadingMore = $state<boolean>(false);
	offset = $state<number>(0);
	feedCounts = $state<Record<string, number>>({});
	modalOpen = $state<boolean>(false);
	browseOpen = $state<boolean>(false);
	view = $state<FeedEntrySize>('compact');
	private generation = 0;
	auth: Auth;
	apiService: ApiService;
	localStorage: LocalStorageService;

	constructor(
		auth: Auth = getAuth(),
		apiService: ApiService = auth.apiService,
		localStorage: LocalStorageService = new LocalStorageService()
	) {
		this.auth = auth;
		this.apiService = apiService;
		this.localStorage = localStorage;
		this.loadView();
		// The saved flags now come from the API; drop the old per-browser copy.
		this.localStorage.destroy(Feeds.LS_LEGACY_IN_LIBRARY_KEY);
	}

	loadView(): void {
		const stored = this.localStorage.get(Feeds.LS_VIEW_KEY);

		if (stored && ['compact', 'comfortable', 'card'].includes(stored)) {
			this.view = stored as FeedEntrySize;
		}
	}

	changeView(size: FeedEntrySize): void {
		this.view = size;
		this.localStorage.set(Feeds.LS_VIEW_KEY, size);
	}

	async load(): Promise<void> {
		const generation = ++this.generation;
		this.loadingMore = true;

		const [feedsRes, itemsRes] = await Promise.all([
			this.apiService.list(apiRoutes.feeds.list),
			this.apiService.list(this.itemsUrl(0))
		]);

		if (generation !== this.generation) return;
		this.loadingMore = false;
		if (!feedsRes) return;

		this.feeds = feedsRes.data as FeedSubscription[];
		this.resetItems();
		if (itemsRes) this.appendItems(itemsRes);
		this.filter();
		this.loaded = true;
	}

	async loadMore(): Promise<void> {
		if (!this.hasMore || this.loadingMore) return;
		const generation = this.generation;
		this.loadingMore = true;

		const res = await this.apiService.list(this.itemsUrl(this.offset));

		if (generation !== this.generation) return;

		if (res) this.appendItems(res);

		this.loadingMore = false;
		this.filter();
	}

	private itemsUrl(offset: number): string {
		const feedFilter = this.activeFeed
			? `&feed_id=${encodeURIComponent(this.activeFeed.feed_id)}`
			: '';
		return `${apiRoutes.feeds.listItems}?offset=${offset}&limit=${Feeds.ITEMS_PER_PAGE}${feedFilter}`;
	}

	private appendItems(res: ListResponse): void {
		const newItems = res.data as FeedItem[];
		this.items = [...this.items, ...newItems];
		this.offset += newItems.length;
		this.hasMore = (res.meta?.has_more as boolean) ?? false;
		this.feedCounts = (res.meta?.feed_counts as Record<string, number>) ?? this.feedCounts;
	}

	filter(): void {
		if (!this.activeFeed) {
			this.filteredItems = [...this.items];
			return;
		}

		this.filteredItems = this.items.filter((item) => item.feed_id === this.activeFeed?.feed_id);
	}

	selectFeed(feed: FeedSubscription | null): void {
		this.activeFeed = feed;
		this.resetItems();
		this.loadMore();
	}

	getFeedCount(feed: FeedSubscription): number {
		return this.feedCounts[feed.feed_id] ?? 0;
	}

	getFeedTitle(feedId: string): string {
		return this.feeds.find((feed) => feed.feed_id === feedId)?.title ?? '';
	}

	async saveToLibrary(item: FeedItem): Promise<boolean> {
		const request: CreateLinkRequest = {
			title: item.title,
			url: item.link,
			category_id: null
		};
		const res = await this.apiService.create(apiRoutes.libraries.links.create, request);
		if (!res) return false;

		this.setSavedLinkId(item.id, (res.data as Link).id);
		return true;
	}

	// 404 and 403 mean the link is already gone from this user's library.
	async unsaveFromLibrary(item: FeedItem): Promise<boolean> {
		if (!item.saved_link_id) return false;

		const res = await this.apiService.deleteWithStatus(
			apiRoutes.libraries.links.delete.replace('%s', item.saved_link_id)
		);
		if (!res.ok && res.status !== 404 && res.status !== 403) return false;

		this.setSavedLinkId(item.id, null);
		return true;
	}

	private setSavedLinkId(itemId: string, linkId: string | null): void {
		const target = this.items.find((entry) => entry.id === itemId);
		if (target) target.saved_link_id = linkId;
	}

	async create(request: CreateFeedSubscriptionRequest): Promise<boolean> {
		const res = await this.apiService.create(apiRoutes.feeds.create, request);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async subscribe(
		request: CreateFeedSubscriptionRequest
	): Promise<{ ok: boolean; duplicate: boolean }> {
		const res = await this.apiService.createWithStatus(apiRoutes.feeds.create, request);
		if (res.ok) await this.load();
		return { ok: res.ok, duplicate: res.status === 409 };
	}

	async update(feed: FeedSubscription, request: UpdateFeedSubscriptionRequest): Promise<boolean> {
		const res = await this.apiService.update(apiRoutes.feeds.update, feed.id, request);
		if (res) await this.load();
		return res;
	}

	async delete(feed: FeedSubscription): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.feeds.delete, feed.id);
		if (res) {
			this.activeFeed = null;
			this.resetItems();
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

	// Bumping the generation makes loadMore() drop responses to requests started before the reset.
	private resetItems(): void {
		this.generation++;
		this.items = [];
		this.filteredItems = [];
		this.offset = 0;
		this.hasMore = true;
		this.loadingMore = false;
	}
}

const FEEDS_KEY = Symbol('SOLYTO_FEEDS');

export function setFeeds(): Feeds {
	return setContext(FEEDS_KEY, new Feeds());
}

export function getFeeds(): Feeds {
	return getContext<Feeds>(FEEDS_KEY);
}
