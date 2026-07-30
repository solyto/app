export interface VideoCategory {
	id: number;
	title: string;
	color: string | null;
	sort_order: number;
}

export interface Video {
	id: string;
	title: string;
	video_id: string | null;
	url: string;
	cover: string | null;
	is_favorite: boolean;
	sort_order: number;
	category: VideoCategory | null;
	created_at: string;
	updated_at: string;
}

export interface CreateVideoRequest {
	title?: string | null;
	url: string;
	cover_path?: string | null;
	is_favorite?: boolean;
	category_id?: number | null;
}

export interface UpdateVideoRequest {
	title?: string;
	url?: string;
	is_favorite?: boolean;
	category_id?: number | null;
}

export interface CreateVideoCategoryRequest {
	title: string;
	color?: string | null;
}

export interface UpdateVideoCategoryRequest {
	title?: string;
	color?: string | null;
}
