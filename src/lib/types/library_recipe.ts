export type RecipeType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink' | 'other';

export interface Recipe {
	id: string;
	title: string;
	cover: string | null;
	link: string | null;
	rating: number | null;
	time_to_make: number | null;
	ingredients: string | null;
	description: string | null;
	type: RecipeType | null;
	created_at: string;
	updated_at: string;
}

export interface CreateRecipeRequest {
	title: string;
	cover_path?: string | null;
	link?: string | null;
	rating?: number | null;
	time_to_make?: number | null;
	ingredients?: string | null;
	description?: string | null;
	type?: RecipeType | null;
}

export interface UpdateRecipeRequest {
	title?: string;
	cover_path?: string | null;
	link?: string | null;
	rating?: number | null;
	time_to_make?: number | null;
	ingredients?: string | null;
	description?: string | null;
	type?: RecipeType | null;
}

export interface ChefkochImport {
	id: number;
	title: string;
	url: string;
	cover: string | null;
	description: string | null;
	ingredients: string | null;
	time_to_make: number | null;
	tags: string[] | null;
}
