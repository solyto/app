export interface YoutubeCategory {
	id: number;
	title: string;
	color: string | null;
	sort_order: number;
}

export interface YoutubeVideo {
	id: string;
	title: string;
	video_id: string | null;
	url: string;
	cover: string | null;
	is_favorite: boolean;
	sort_order: number;
	category: YoutubeCategory | null;
	created_at: string;
	updated_at: string;
}

export interface CreateYoutubeVideoRequest {
	title?: string | null;
	url: string;
	cover_path?: string | null;
	is_favorite?: boolean;
	category_id?: number | null;
}

export interface UpdateYoutubeVideoRequest {
	title?: string;
	url?: string;
	is_favorite?: boolean;
	category_id?: number | null;
}

export interface CreateYoutubeCategoryRequest {
	title: string;
	color?: string | null;
}

export interface UpdateYoutubeCategoryRequest {
	title?: string;
	color?: string | null;
}
