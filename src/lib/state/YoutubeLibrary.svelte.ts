import type {
	YoutubeVideo,
	CreateYoutubeVideoRequest,
	UpdateYoutubeVideoRequest,
	YoutubeCategory
} from '$lib/types/library_youtube';
import { getContext, setContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import LibraryFilterService from '$lib/services/LibraryFilterService';
import LocalStorageService from '$lib/services/LocalStorageService';
import type { LibraryConfig } from '$lib/types/library';

export class YoutubeLibrary {
	static readonly LS_VIEW_KEY: string = 'youtube_view';

	config: LibraryConfig = {
		type: 'youtube',
		hasCovers: true,
		hasRatings: false,
		hasViewSwitcher: true,
		hasFilters: false,
		hasGenres: false,
		hasRecommender: false,
		hasWishlist: false,
		hasExternalLinks: false,
		hasReleases: false,
		hasShelf: false,
		entriesAreLinks: true
	};
	loaded = $state<boolean>(false);
	entries = $state<YoutubeVideo[]>([]);
	filteredEntries = $state<YoutubeVideo[]>([]);
	categories = $state<YoutubeCategory[]>([]);
	categoriesCount = $state<{ id: number; count: number }[]>([]);
	activeFilter = $state<null | number | 'favorite'>(null);
	searchVisible = $state<boolean>(false);
	searchTerm = $state<string>('');
	draggedEntry = $state<YoutubeVideo | null>(null);
	dragTarget = $state<number | null>(null);
	view = $state<'list' | 'cards'>('cards');
	createModalVisible = $state<boolean>(false);
	auth = getAuth();
	filterService = new LibraryFilterService();
	localStorage = new LocalStorageService();
	apiService: ApiService;

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());

		const saved = this.localStorage.get(YoutubeLibrary.LS_VIEW_KEY);
		this.view = (saved as 'list' | 'cards' | null) ?? 'cards';
	}

	async load(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.libraries.youtube.list);

		if (res) {
			this.entries = res.data as YoutubeVideo[];
			await this.loadCategories();
			this.reapplyFilter();
			this.loaded = true;
		}
	}

	async loadCategories(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.libraries.youtube.listCategories);

		if (res) {
			this.categories = res.data as YoutubeCategory[];

			if (this.categoriesCount.length > 0) {
				this.categoriesCount = [];
			}

			for (const category of this.categories) {
				this.categoriesCount.push({
					id: category.id,
					count: this.entries.filter((video) => video.category?.id === category.id).length
				});
			}
		}
	}

	search(): void {
		this.filteredEntries = this.filterService.search(this.entries, this.searchTerm, [
			'title',
			'url'
		]);
	}

	getCategoryCount(categoryId?: number | null): number {
		if (categoryId === undefined) return this.entries.length;
		if (categoryId === null)
			return this.entries.filter((video) => video.category === null).length;

		return this.categoriesCount.find((category) => category.id === categoryId)?.count ?? 0;
	}

	getFavoriteCount(): number {
		return this.entries.filter((video) => video.is_favorite).length;
	}

	openCreateModal(): void {
		this.createModalVisible = true;
		this.searchVisible = false;
	}

	closeCreateModal(): void {
		this.createModalVisible = false;
	}

	filterByCategory(categoryId: number | null): void {
		this.activeFilter = categoryId;

		if (categoryId === null) {
			this.filteredEntries = this.entries;
		} else if (categoryId === 0) {
			this.filteredEntries = this.entries.filter((video) => video.category === null);
		} else {
			this.filteredEntries = this.entries.filter((video) => video.category?.id === categoryId);
		}
	}

	filterByFavorite(): void {
		this.activeFilter = 'favorite';
		this.filteredEntries = this.entries.filter((video) => video.is_favorite);
	}

	reapplyFilter(): void {
		if (this.activeFilter === 'favorite') {
			this.filterByFavorite();
		} else {
			this.filterByCategory(this.activeFilter);
		}
	}

	async dragToCategory(): Promise<void> {
		if (this.draggedEntry === null) return;

		const request: UpdateYoutubeVideoRequest = {
			category_id: this.dragTarget ? this.dragTarget : null
		};
		const ok = await this.apiService.update(
			apiRoutes.libraries.youtube.update,
			this.draggedEntry.id,
			request
		);
		if (ok) await this.load();
		return Promise.resolve();
	}

	async create(request: CreateYoutubeVideoRequest): Promise<boolean> {
		const res = await this.apiService.create(apiRoutes.libraries.youtube.create, request);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async update(entry: YoutubeVideo, request: UpdateYoutubeVideoRequest): Promise<boolean> {
		const res = await this.apiService.update(
			apiRoutes.libraries.youtube.update,
			entry.id,
			request
		);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async delete(entry: YoutubeVideo): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.libraries.youtube.delete, entry.id);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async reorder(ids: string[]): Promise<void> {
		await this.apiService.put(apiRoutes.libraries.youtube.reorder, { videos: ids });
		await this.load();
	}

	async createCategory(title: string, color?: string): Promise<boolean> {
		const res = await this.apiService.create(apiRoutes.libraries.youtube.createCategory, {
			title,
			color
		});
		if (res) await this.loadCategories();
		return Promise.resolve(res !== null);
	}

	async deleteCategory(category: YoutubeCategory): Promise<boolean> {
		const res = await this.apiService.delete(
			apiRoutes.libraries.youtube.deleteCategory,
			category.id
		);
		if (res) await this.loadCategories();
		return Promise.resolve(res !== null);
	}

	async reorderCategories(ids: number[]): Promise<void> {
		await this.apiService.put(apiRoutes.libraries.youtube.reorderCategories, { categories: ids });
		await this.loadCategories();
	}
}

const YOUTUBE_LIBRARY_KEY = Symbol('SOLYTO_YOUTUBE_LIBRARY');

export function setYoutubeLibrary(): YoutubeLibrary {
	return setContext(YOUTUBE_LIBRARY_KEY, new YoutubeLibrary());
}

export function getYoutubeLibrary(): YoutubeLibrary {
	return getContext<YoutubeLibrary>(YOUTUBE_LIBRARY_KEY);
}
