export interface AuthToken {
	token: string | null;
	token_type: string | null;
	expires_at: string | null;
}

export interface UserProfile {
	profile_image_path: string | null;
}

export interface UserSettings {
	language: string;
	timezone: string;
	date_format: string;
	time_format: string;
	widgets: string;
	ai_enabled: boolean;
	navigation: string;
	openai_api_key: string | null;
	first_visit: boolean;
	temperature_unit: 'c' | 'f';
}

export interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	profile: UserProfile;
	settings: UserSettings;
	created_at: string;
	updated_at: string;
	additional_info_last_updated_at: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	token_type: string;
	token_expires_at: string;
	user: User;
}

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
	password_confirmation: string;
	language?: string;
}

export interface VerifyRequest {
	user_id: string;
	token: string;
}
