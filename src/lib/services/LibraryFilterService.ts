import type { Music, MusicGenre } from '$lib/types/library_music';
import type { Book, BookGenre } from '$lib/types/library_book';
import type { Quote } from '$lib/types/library_quote';
import type { Link } from '$lib/types/library_link';
import type { Recipe, RecipeType } from '$lib/types/library_recipe';
import type { Movie, MovieGenre } from '$lib/types/library_movie';
import type { Game } from '$lib/types/library_game';

export default class LibraryFilterService {
	search<T extends Music | Book | Quote | Link | Recipe | Movie | Game>(
		entries: T[],
		searchTerm: string,
		fields: string[]
	): T[] {
		if (searchTerm.length === 0) return entries;

		return entries.filter((entry) => {
			return fields.some((field) => {
				return String(entry[field]).toLowerCase().includes(searchTerm.toLowerCase());
			});
		});
	}

	byRating<T extends Music | Book | Recipe | Movie>(entries: T[], rating: number | null): T[] {
		if (rating === null) return entries;

		return entries.filter((entry) => entry.rating === rating);
	}

	byGenre<T extends Music | Book | Movie>(
		entries: T[],
		genre: MusicGenre | BookGenre | MovieGenre | null
	): T[] {
		if (genre === null) return entries;

		return entries.filter((entry) => entry.genres.some((g) => g.id === genre.id));
	}

	byGenreAndRating<T extends Music | Book | Movie | Game>(
		entries: T[],
		genre: MusicGenre | BookGenre | null,
		rating: number | null
	): T[] {
		return this.byGenre(this.byRating(entries, rating), genre);
	}

	byType<T extends Recipe>(entries: T[], type: RecipeType | null): T[] {
		if (type === null) return entries;

		return entries.filter((entry) => entry.type === type);
	}

	byWishlist<T extends Music | Book | Movie | Game>(entries: T[]): T[] {
		return entries.filter((entry) => entry.wishlist);
	}
}
