export interface PlannerEntry {
	id: number;
	date: string; // YYYY-MM-DD
	title: string;
	start_minutes: number; // minutes since midnight
	duration_minutes: number;
	is_all_day: boolean;
	color: string | null; // hex, #RRGGBB (7 chars)
	todo_id: string | null; // opaque soft link, never resolved
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface CreatePlannerEntryRequest {
	date: string;
	title: string;
	start_minutes: number;
	duration_minutes: number;
	is_all_day?: boolean;
	color?: string | null;
	todo_id?: string | null;
	sort_order?: number;
}

export interface UpdatePlannerEntryRequest {
	title?: string;
	start_minutes?: number;
	duration_minutes?: number;
	is_all_day?: boolean;
	color?: string | null;
	todo_id?: string | null;
	sort_order?: number;
}
