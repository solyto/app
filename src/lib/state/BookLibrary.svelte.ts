import type {
	Book,
	BookGenre,
	CreateBookRequest,
	UpdateBookRequest,
	CreateBookGenreRequest,
	BookRelease,
	HardcoverImport,
	GoodreadsImport
} from '$lib/types/library_book';
import type {
	LibraryRecommendationType,
	LibraryRecommendation,
	LibraryConfig
} from '$lib/types/library';
import { getContext, setContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import LibraryFilterService from '$lib/services/LibraryFilterService';
import { browser } from '$app/environment';
import type { DeezerImport } from '$lib/types/library_music';

export class BookLibrary {
	config: LibraryConfig = {
		type: 'books',
		hasCovers: true,
		hasRatings: true,
		hasViewSwitcher: true,
		hasFilters: true,
		hasGenres: true,
		hasRecommender: true,
		hasWishlist: true,
		hasExternalLinks: true,
		hasReleases: true,
		hasShelf: true,
		entriesAreLinks: false
	};
	loaded = $state<boolean>(false);
	entries = $state<Book[]>([]);
	filteredEntries = $state<Book[]>([]);
	genres = $state<BookGenre[]>([]);
	createModalVisible = $state<boolean>(false);
	detailModalVisible = $state<boolean>(false);
	genreModalVisible = $state<boolean>(false);
	searchVisible = $state<boolean>(false);
	activeEntry = $state<Book | null>(null);
	ratingFilter = $state<number | null>(null);
	genreFilter = $state<BookGenre | null>(null);
	wishlistFilter = $state<boolean>(false);
	searchTerm = $state<string>('');
	releases = $state<BookRelease[]>([]);
	releasesLoaded = $state<boolean>(false);
	view = $state<'list' | 'cards' | 'shelf' | 'spine'>('cards');
	auth = getAuth();
	filterService = new LibraryFilterService();
	apiService: ApiService;

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());
		if (browser) {
			const saved = localStorage.getItem('solyto_books_view') as 'list' | 'cards' | 'shelf' | 'spine' | null;
			if (saved) this.view = saved;
		}
	}

	async load(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.libraries.books.list);
		if (res) {
			this.entries = res.data as Book[];
			this.filteredEntries = this.entries;
			await this.loadGenres();
			this.loaded = true;
		}
	}

	async loadGenres(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.libraries.books.listGenres);
		if (res) {
			this.genres = res.data as BookGenre[];
		}
	}

	async loadReleases(): Promise<boolean> {
		const res = await this.apiService.list(apiRoutes.libraries.books.releases);
		if (res) this.releases = res.data as BookRelease[];
		this.releasesLoaded = true;
		return Promise.resolve(res !== null);
	}

	search(): void {
		this.genreFilter = null;
		this.ratingFilter = null;
		this.filteredEntries = this.filterService.search(this.entries, this.searchTerm, [
			'title',
			'artist',
			'series'
		]);
	}

	filterByGenreAndRating(): void {
		this.filteredEntries = this.filterService.byGenreAndRating(
			this.entries,
			this.genreFilter,
			this.ratingFilter
		);
	}

	filterByWishlist(): void {
		this.wishlistFilter = true;
		this.filteredEntries = this.filterService.byWishlist(this.entries);
	}

	clearFilters(): void {
		this.genreFilter = null;
		this.ratingFilter = null;
		this.wishlistFilter = false;
		this.filteredEntries = this.entries;
	}

	async recommend(type: LibraryRecommendationType): Promise<LibraryRecommendation | null> {
		const res = await this.apiService.get(apiRoutes.libraries.books.recommend, type);
		if (res) return res.data as LibraryRecommendation;
		return null;
	}

	addRatingFilter(rating: number | null): void {
		this.ratingFilter = rating;
		this.filterByGenreAndRating();
	}

	addGenreFilter(genre: BookGenre | null): void {
		this.genreFilter = genre;
		this.filterByGenreAndRating();
	}

	openCreateModal(entry?: Book): void {
		if (entry) this.activeEntry = entry;

		this.createModalVisible = true;
		this.searchVisible = false;
	}

	closeCreateModal(): void {
		this.activeEntry = null;
		this.createModalVisible = false;
	}

	openDetailModal(entry: Book) {
		this.activeEntry = entry;
		this.detailModalVisible = true;
		this.searchVisible = false;
	}

	closeDetailModal(): void {
		this.detailModalVisible = false;
		this.activeEntry = null;
	}

	openGenreModal(): void {
		this.genreModalVisible = true;
		this.searchVisible = false;
	}

	closeGenreModal(): void {
		this.genreModalVisible = false;
	}

	switchView(): void {
		if (this.view === 'list') this.view = 'cards';
		else if (this.view === 'cards') this.view = 'shelf';
		else this.view = 'list';
	}

	async create(request: CreateBookRequest): Promise<boolean> {
		const res = await this.apiService.create(apiRoutes.libraries.books.create, request);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async update(entry: Book, request: UpdateBookRequest): Promise<boolean> {
		const res = await this.apiService.update(
			apiRoutes.libraries.books.update,
			entry.id,
			request
		);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async delete(entry: Book): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.libraries.books.delete, entry.id);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async updateRating(entry: Book, rating: number): Promise<boolean> {
		const request: UpdateBookRequest = { rating };
		const res = await this.apiService.update(
			apiRoutes.libraries.books.update,
			entry.id,
			request
		);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async createGenre(title: string): Promise<boolean> {
		const request: CreateBookGenreRequest = { title };
		const res = await this.apiService.create(apiRoutes.libraries.books.createGenre, request);
		if (res) await this.loadGenres();
		return Promise.resolve(res !== null);
	}

	async deleteGenre(genre: BookGenre): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.libraries.books.deleteGenre, genre.id);
		if (res) await this.loadGenres();
		return Promise.resolve(res !== null);
	}

	async importFromHardcover(url: string): Promise<HardcoverImport | null> {
		const res = await this.apiService.post(apiRoutes.libraries.books.importFromHardcover, {
			url
		});
		if (res) return res.data as HardcoverImport;
		return null;
	}

	async importFromGoodreads(url: string): Promise<GoodreadsImport | null> {
		const res = await this.apiService.post(apiRoutes.libraries.books.importFromGoodreads, {
			url
		});
		if (res) return res.data as GoodreadsImport;
		return null;
	}
}

const BOOK_LIBRARY_KEY = Symbol('SOLYTO_BOOK_LIBRARY');

export function setBookLibrary(): BookLibrary {
	return setContext(BOOK_LIBRARY_KEY, new BookLibrary());
}

export function getBookLibrary(): BookLibrary {
	return getContext<BookLibrary>(BOOK_LIBRARY_KEY);
}
