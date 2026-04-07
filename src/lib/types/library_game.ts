import type { Tag } from './tag';

export interface GameGenre {
	id: number;
	title: string;
	created_at: string;
	updated_at: string;
}

export interface Game {
	id: string;
	title: string;
	platform: string;
	developer: string | null;
	publisher: string | null;
	cover: string | null;
	link: string | null;
	rating: number | null;
	publication_year: number | null;
	playtime_hours: number | null;
	completed: boolean;
	wishlist: boolean;
	genres: GameGenre[];
	tags: Tag[];
	started_at: string | null;
	finished_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreateGameRequest {
	title: string;
	platform: string;
	developer?: string | null;
	publisher?: string | null;
	rating?: number | null;
	publication_year?: number | null;
	playtime_hours?: number | null;
	completed?: boolean;
	wishlist?: boolean;
	cover_path?: string | null;
	link?: string | null;
	started_at?: string | null;
	finished_at?: string | null;
	genres?: number[];
	tags?: number[];
}

export interface UpdateGameRequest {
	title?: string;
	platform?: string | null;
	developer?: string | null;
	publisher?: string | null;
	rating?: number | null;
	publication_year?: number | null;
	playtime_hours?: number | null;
	completed?: boolean;
	wishlist?: boolean;
	cover_path?: string | null;
	link?: string | null;
	started_at?: string | null;
	finished_at?: string | null;
	genres?: number[];
	tags?: number[];
}

export interface CreateGameGenreRequest {
	title: string;
}

export interface UpdateGameGenreRequest {
	title: string;
}

export interface SteamImport {
	id: number;
	title: string;
	url: string;
	cover: string | null;
	description: string | null;
	release_date: string | null;
	developer: string | null;
	publisher: string | null;
	genres: string[];
}

export interface BggImport {
	id: number;
	title: string;
	url: string;
	cover: string | null;
	description: string | null;
	publication_year: number | null;
	designer: string | null;
	publisher: string | null;
	genres: string[];
}
