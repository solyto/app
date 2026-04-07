import type { Tag } from './tag';

export interface MovieGenre {
	id: number;
	title: string;
	created_at: string;
	updated_at: string;
}

export interface Movie {
	id: string;
	title: string;
	category: string;
	cover: string | null;
	link: string | null;
	rating: number | null;
	publication_year: number | null;
	wishlist: boolean;
	genres: MovieGenre[];
	tags: Tag[];
	started_at: string | null;
	finished_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreateMovieRequest {
	title: string;
	category: string;
	rating?: number | null;
	publication_year?: number | null;
	wishlist?: boolean;
	cover_path?: string | null;
	link?: string | null;
	started_at?: string | null;
	finished_at?: string | null;
	genres?: number[];
	tags?: number[];
}

export interface UpdateMovieRequest {
	title?: string;
	category?: string | null;
	rating?: number | null;
	publication_year?: number | null;
	wishlist?: boolean;
	cover_path?: string | null;
	link?: string | null;
	started_at?: string | null;
	finished_at?: string | null;
	genres?: number[];
	tags?: number[];
}

export interface CreateMovieGenreRequest {
	title: string;
}

export interface UpdateMovieGenreRequest {
	title: string;
}

export interface ImdbImport {
	id: number;
	type: string;
	title: string;
	url: string;
	cover: string;
	release_year: number;
	genres: string[];
}
