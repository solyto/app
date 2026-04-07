import type {
	Movie,
	MovieGenre,
	CreateMovieRequest,
	UpdateMovieRequest,
	CreateMovieGenreRequest,
	ImdbImport
} from '$lib/types/library_movie';
import { getContext, setContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import LibraryFilterService from '$lib/services/LibraryFilterService';
import type { LibraryConfig } from '$lib/types/library';
import type { DeezerImport } from '$lib/types/library_music';
import type { Book } from '$lib/types/library_book';

export class MovieLibrary {
	config: LibraryConfig = {
		type: 'movies',
		hasCovers: true,
		hasRatings: true,
		hasViewSwitcher: true,
		hasFilters: true,
		hasGenres: true,
		hasRecommender: false,
		hasWishlist: true,
		hasExternalLinks: true,
		hasReleases: false,
		hasShelf: false,
		entriesAreLinks: false
	};
	loaded = $state<boolean>(false);
	entries = $state<Movie[]>([]);
	filteredEntries = $state<Movie[]>([]);
	genres = $state<MovieGenre[]>([]);
	createModalVisible = $state<boolean>(false);
	detailModalVisible = $state<boolean>(false);
	genreModalVisible = $state<boolean>(false);
	searchVisible = $state<boolean>(false);
	activeEntry = $state<Movie | null>(null);
	ratingFilter = $state<number | null>(null);
	genreFilter = $state<MovieGenre | null>(null);
	wishlistFilter = $state<boolean>(false);
	searchTerm = $state<string>('');
	view = $state<'list' | 'cards'>('cards');
	auth = getAuth();
	filterService = new LibraryFilterService();
	apiService: ApiService;

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());
	}

	async load(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.libraries.movies.list);
		if (res) {
			this.entries = res.data as Movie[];
			this.filteredEntries = this.entries;
			await this.loadGenres();
			this.loaded = true;
		}
	}

	async loadGenres(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.libraries.movies.listGenres);
		if (res) {
			this.genres = res.data as MovieGenre[];
		}
	}

	search(): void {
		this.genreFilter = null;
		this.ratingFilter = null;
		this.filteredEntries = this.filterService.search(this.entries, this.searchTerm, ['title']);
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

	addRatingFilter(rating: number | null): void {
		this.ratingFilter = rating;
		this.filterByGenreAndRating();
	}

	addGenreFilter(genre: MovieGenre | null): void {
		this.genreFilter = genre;
		this.filterByGenreAndRating();
	}

	openCreateModal(entry?: Movie): void {
		if (entry) this.activeEntry = entry;

		this.createModalVisible = true;
		this.searchVisible = false;
	}

	closeCreateModal(): void {
		this.activeEntry = null;
		this.createModalVisible = false;
	}

	openDetailModal(entry: Movie) {
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
		this.view = this.view === 'list' ? 'cards' : 'list';
	}

	async create(request: CreateMovieRequest): Promise<boolean> {
		const res = await this.apiService.create(apiRoutes.libraries.movies.create, request);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async update(entry: Movie, request: UpdateMovieRequest): Promise<boolean> {
		const res = await this.apiService.update(
			apiRoutes.libraries.movies.update,
			entry.id,
			request
		);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async delete(entry: Movie): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.libraries.movies.delete, entry.id);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async updateRating(entry: Movie, rating: number): Promise<boolean> {
		const request: UpdateMovieRequest = { rating };
		const res = await this.apiService.update(
			apiRoutes.libraries.movies.update,
			entry.id,
			request
		);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async createGenre(title: string): Promise<boolean> {
		const request: CreateMovieGenreRequest = { title };
		const res = await this.apiService.create(apiRoutes.libraries.movies.createGenre, request);
		if (res) await this.loadGenres();
		return Promise.resolve(res !== null);
	}

	async deleteGenre(genre: MovieGenre): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.libraries.movies.deleteGenre, genre.id);
		if (res) await this.loadGenres();
		return Promise.resolve(res !== null);
	}

	async importFromImdb(url: string): Promise<ImdbImport | null> {
		const res = await this.apiService.post(apiRoutes.libraries.movies.importFromImdb, { url });
		if (res) return res.data as ImdbImport;
		return null;
	}
}

const MOVIE_LIBRARY_KEY = Symbol('SOLYTO_MOVIE_LIBRARY');

export function setMovieLibrary(): MovieLibrary {
	return setContext(MOVIE_LIBRARY_KEY, new MovieLibrary());
}

export function getMovieLibrary(): MovieLibrary {
	return getContext<MovieLibrary>(MOVIE_LIBRARY_KEY);
}
