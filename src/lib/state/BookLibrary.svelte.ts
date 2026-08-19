import type {
	Book,
	BookGenre,
	CreateBookRequest,
	UpdateBookRequest,
	CreateBookGenreRequest,
	BookRelease,
	BookSearchResult,
	Author,
	CreateAuthorRequest,
	UpdateAuthorRequest
} from '$lib/types/library_book';
import type {
	LibraryRecommendationType,
	LibraryRecommendation,
	LibraryConfig
} from '$lib/types/library';
import { getContext, setContext } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import { urls } from '$lib/config/urls';
import LibraryFilterService from '$lib/services/LibraryFilterService';
import LocalStorageService from '$lib/services/LocalStorageService';

export class BookLibrary {
	static readonly LS_VIEW_KEY: string = 'books_view';

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
		hasAuthors: true,
		entriesAreLinks: false
	};
	loaded = $state<boolean>(false);
	entries = $state<Book[]>([]);
	filteredEntries = $state<Book[]>([]);
	genres = $state<BookGenre[]>([]);
	authors = $state<Author[]>([]);
	filteredAuthors = $state<Author[]>([]);
	authorsLoaded = $state<boolean>(false);
	authorFavoritesFilter = $state<boolean>(false);
	createModalVisible = $state<boolean>(false);
	detailModalVisible = $state<boolean>(false);
	genreModalVisible = $state<boolean>(false);
	authorCreatePromptVisible = $state<boolean>(false);
	searchVisible = $state<boolean>(false);
	externalSearchModalVisible = $state<boolean>(false);
	activeEntry = $state<Book | null>(null);
	ratingFilter = $state<number | null>(null);
	genreFilter = $state<BookGenre | null>(null);
	wishlistFilter = $state<boolean>(false);
	lentFilter = $state<boolean>(false);
	searchTerm = $state<string>('');
	releases = $state<BookRelease[]>([]);
	releasesLoaded = $state<boolean>(false);
	view = $state<'list' | 'cards' | 'shelf' | 'spine' | 'authors'>('cards');
	auth = getAuth();
	filterService = new LibraryFilterService();
	apiService: ApiService;
	localStorage = new LocalStorageService();

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());
		const saved = this.localStorage.get(BookLibrary.LS_VIEW_KEY);
		this.view = (saved as 'list' | 'cards' | 'shelf' | 'spine' | 'authors' | null) ?? 'cards';
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

	async loadAuthors(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.libraries.books.authors.list);
		if (res) {
			this.authors = res.data as Author[];
			this.applyAuthorFavoritesFilter();
			this.authorsLoaded = true;
		}
	}

	async loadAuthor(id: number): Promise<Author | null> {
		const res = await this.apiService.get(apiRoutes.libraries.books.authors.get, id);
		return res ? (res.data as Author) : null;
	}

	applyAuthorFavoritesFilter(): void {
		this.filteredAuthors = this.authorFavoritesFilter
			? this.authors.filter((author) => author.is_favorite)
			: this.authors;
	}

	toggleAuthorFavoritesFilter(): void {
		this.authorFavoritesFilter = !this.authorFavoritesFilter;
		this.applyAuthorFavoritesFilter();
	}

	async createAuthor(request: CreateAuthorRequest): Promise<Author | null> {
		const res = await this.apiService.create(apiRoutes.libraries.books.authors.create, request);
		if (res) await this.loadAuthors();
		return res ? (res.data as Author) : null;
	}

	async updateAuthor(author: Author, request: UpdateAuthorRequest): Promise<boolean> {
		const res = await this.apiService.update(
			apiRoutes.libraries.books.authors.update,
			author.id,
			request
		);
		if (res) await this.loadAuthors();
		return res;
	}

	async toggleAuthorFavorite(author: Author): Promise<boolean> {
		return await this.updateAuthor(author, { is_favorite: !author.is_favorite });
	}

	async deleteAuthor(author: Author): Promise<boolean> {
		const res = await this.apiService.delete(
			apiRoutes.libraries.books.authors.delete,
			author.id
		);
		if (res) {
			await Promise.all([this.loadAuthors(), this.load()]);
		}
		return res;
	}

	async uploadAuthorPhoto(author: Author, file: File): Promise<boolean> {
		const formData = new FormData();
		formData.append('file', file);
		const res = await this.apiService.uploadFile(
			apiRoutes.libraries.books.authors.uploadPhoto,
			author.id.toString(),
			formData
		);
		if (res) await this.loadAuthors();
		return res !== null;
	}

	async resyncAuthorFromHardcover(author: Author): Promise<Author | null> {
		const res = await this.apiService.post(
			apiRoutes.libraries.books.authors.resync.replace('%d', author.id.toString()),
			{}
		);
		if (res) await this.loadAuthors();
		return res ? (res.data as Author) : null;
	}

	async unlinkBook(book: Book): Promise<boolean> {
		const ok = await this.update(book, { author_id: null });
		if (ok) await this.loadAuthors();
		return ok;
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
			'author',
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
		this.lentFilter = false;
		this.wishlistFilter = true;
		this.filteredEntries = this.filterService.byWishlist(this.entries);
	}

	filterByLent(): void {
		this.wishlistFilter = false;
		this.lentFilter = true;
		this.filteredEntries = this.filterService.byLent(this.entries);
	}

	clearFilters(): void {
		this.genreFilter = null;
		this.ratingFilter = null;
		this.wishlistFilter = false;
		this.lentFilter = false;
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

	openAuthorCreatePrompt(): void {
		this.authorCreatePromptVisible = true;
		this.searchVisible = false;
	}

	closeAuthorCreatePrompt(): void {
		this.authorCreatePromptVisible = false;
	}

	async createAuthorAndNavigate(name: string): Promise<Author | null> {
		const author = await this.createAuthor({ name });
		if (author) {
			this.closeAuthorCreatePrompt();
			await goto(resolve(urls.bookAuthor, { id: author.id.toString() }));
		}

		return author;
	}

	openExternalSearchModal(): void {
		this.externalSearchModalVisible = true;
	}

	closeExternalSearchModal(): void {
		this.externalSearchModalVisible = false;
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

	async createGenre(title: string): Promise<BookGenre | null> {
		const request: CreateBookGenreRequest = { title };
		const res = await this.apiService.create(apiRoutes.libraries.books.createGenre, request);
		if (res) await this.loadGenres();
		return res ? (res.data as BookGenre) : null;
	}

	async deleteGenre(genre: BookGenre): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.libraries.books.deleteGenre, genre.id);
		if (res) await this.loadGenres();
		return Promise.resolve(res !== null);
	}

	async searchAt(provider: string, query: string): Promise<BookSearchResult[] | null> {
		const res = await this.apiService.list(
			`${apiRoutes.libraries.books.search}/${provider}/${encodeURIComponent(query)}`
		);
		if (res) return res.data as BookSearchResult[];
		return null;
	}

	async importFrom(provider: string, url: string): Promise<BookRelease | null> {
		const res = await this.apiService.post(
			`${apiRoutes.libraries.books.import}/${provider}`,
			{ url }
		);
		if (res) return res.data as BookRelease;
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
