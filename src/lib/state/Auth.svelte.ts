import type {
	AuthToken,
	User,
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	VerifyRequest
} from '$lib/types/auth';
import { setContext, getContext } from 'svelte';
import { page } from '$app/state';
import { browser } from '$app/environment';
import { urls } from '$lib/config/urls';
import { apiRoutes } from '$lib/config/apiRoutes';
import ApiService from '$lib/services/ApiService';
import { SvelteDate } from 'svelte/reactivity';
import {
	formatDate,
	formatDateTime,
	formatDateWithoutYear,
	formatDateWithWeekday,
	formatTime,
	formatTimeWithSeconds
} from '$lib/helpers/DateHelper';

export class Auth {
	loggedIn = $state<boolean>(false);
	authToken = $state<AuthToken | null>(null);
	user = $state<User | null>(null);
	apiService: ApiService;
	profileCache = new Map<string, User>();

	constructor() {
		this.apiService = new ApiService(null);
		this.load().then();
	}

	private async load(): Promise<void> {
		if (!browser) return;

		const savedAuth = localStorage.getItem('auth');

		if (!savedAuth) return;

		const { user, authToken } = JSON.parse(savedAuth);

		if (!authToken || !user) return;

		const expiresAt = new SvelteDate(authToken.expires_at).getTime();

		if (expiresAt > Date.now()) {
			this.user = user;
			this.authToken = authToken;
			this.apiService.updateAuthToken(this.getToken()!);
			this.loggedIn = true;

			if (expiresAt < Date.now() + 24 * 60 * 60 * 1000) {
				await this.refresh();
			}

			await this.loadAdditionalData();

			this.save();
		} else {
			localStorage.removeItem('auth');
		}
	}

	public async loadAdditionalData(): Promise<void> {
		if (!this.user) return;
		const res = await this.apiService.get(apiRoutes.users.get, null);
		if (res) this.user = res.data as User;
		this.save();
	}

	public save(): void {
		if (!browser) return;

		localStorage.setItem(
			'auth',
			JSON.stringify({
				user: this.user,
				authToken: this.authToken
			})
		);
	}

	private clear(): void {
		if (!browser) return;

		localStorage.removeItem('auth');
		this.user = null;
		this.authToken = null;
		this.loggedIn = false;
	}

	async login(request: LoginRequest): Promise<boolean> {
		const res = await this.apiService.post(apiRoutes.auth.login, request);

		if (!res) return Promise.resolve(false);
		const login = res.data as LoginResponse;

		this.user = login.user;
		this.authToken = {
			token: login.token,
			token_type: login.token_type,
			expires_at: login.token_expires_at
		};
		this.loggedIn = true;

		this.save();
		await this.load();

		return Promise.resolve(true);
	}

	async refresh(): Promise<boolean> {
		this.apiService.updateAuthToken(this.getToken()!);
		const res = await this.apiService.post(apiRoutes.auth.refresh, {});

		if (!res) return Promise.resolve(false);
		const refresh = res.data as LoginResponse;

		this.user = refresh.user;
		this.authToken = {
			token: refresh.token,
			token_type: refresh.token_type,
			expires_at: refresh.token_expires_at
		};
		this.loggedIn = true;

		this.save();

		return Promise.resolve(true);
	}

	logout(): void {
		this.clear();
	}

	isAdmin(): boolean {
		return this.user?.role === 'admin' || this.user?.role === 'super_admin';
	}

	async register(request: RegisterRequest): Promise<{ success: boolean; errors?: Record<string, string[]> }> {
		const res: any = await this.apiService.postRaw(apiRoutes.auth.register, request);
		return { success: res?.success === true, errors: res?.errors };
	}

	async verify(request: VerifyRequest): Promise<object> {
		const res = await this.apiService.postRaw(apiRoutes.auth.verify, request);
		return Promise.resolve(res);
	}

	getToken(): string | null {
		return this.authToken?.token ?? null;
	}

	async updateNavigation(navigation: string): Promise<boolean> {
		const res = await this.apiService.put(apiRoutes.users.settings.updateNavigationSettings, {
			navigation
		});
		return Promise.resolve(res);
	}

	async updateTimezone(timezone: string): Promise<boolean> {
		const res = await this.apiService.put(apiRoutes.users.settings.updateTimezone, {
			timezone
		});
		return Promise.resolve(res);
	}

	async updateDateFormat(dateFormat: string): Promise<boolean> {
		const res = await this.apiService.put(apiRoutes.users.settings.updateDateFormat, {
			date_format: dateFormat
		});
		return Promise.resolve(res);
	}

	async updateTimeFormat(timeFormat: string): Promise<boolean> {
		const res = await this.apiService.put(apiRoutes.users.settings.updateTimeFormat, {
			time_format: timeFormat
		});
		return Promise.resolve(res);
	}

	async updateLanguage(language: string): Promise<boolean> {
		const res = await this.apiService.put(apiRoutes.users.settings.updateLanguage, {
			language
		});
		if (res) await this.loadAdditionalData();
		return Promise.resolve(res);
	}

	async completeOnboarding(): Promise<boolean> {
		const res = await this.apiService.put(apiRoutes.users.settings.completeOnboarding, {});
		if (res && this.user?.settings) {
			this.user.settings.first_visit = false;
			this.save();
		}
		return Promise.resolve(res);
	}

	async setOpenaiApiKey(key: string | null): Promise<boolean> {
		const res = await this.apiService.put(apiRoutes.users.settings.updateOpenaiApiKey, { key });
		await this.loadAdditionalData();
		return Promise.resolve(res);
	}

	async setProfileImage(file: File): Promise<boolean> {
		if (!file.type.startsWith('image/')) {
			return Promise.resolve(false);
		}

		const formData = new FormData();
		formData.append('profile_image', file);

		const res = await this.apiService.postFormData(
			apiRoutes.users.updateProfileImage,
			formData
		);
		await this.loadAdditionalData();
		return Promise.resolve(res);
	}

	async getPublicProfile(userId: string): Promise<User | null> {
		if (this.profileCache.has(userId)) return this.profileCache.get(userId)!;
		const res = await this.apiService.get(apiRoutes.users.getPublicProfile, userId);
		const user = res?.data as User | null;
		if (user) this.profileCache.set(userId, user);
		return user;
	}

	getDateInUserPreferredFormat(input: string | Date): string {
		return formatDate(input, this?.user?.settings?.date_format ?? null);
	}

	getDateWithoutYearInUserPreferredFormat(input: string | Date): string {
		return formatDateWithoutYear(input, this?.user?.settings?.date_format ?? null);
	}

	getDateWithWeekdayInUserPreferredFormat(input: string | Date): string {
		return formatDateWithWeekday(input, this?.user?.settings?.date_format ?? null);
	}

	getDateTimeInUserPreferredFormat(input: string | Date): string {
		return formatDateTime(
			input,
			this?.user?.settings?.date_format ?? null,
			this?.user?.settings?.time_format ?? null
		);
	}

	getTimeInUserPreferredFormat(input: string | Date): string {
		return formatTime(input, this?.user?.settings?.time_format ?? null);
	}

	getTimeWithSecondsInUserPreferredFormat(input: string | Date): string {
		return formatTimeWithSeconds(input, this?.user?.settings?.time_format ?? null);
	}

	getTemperatureInUserPreferredFormat(temperature: number): number {
		if (this?.user?.settings?.temperature_unit === 'c') return temperature;

		return Math.round((temperature * 9) / 5 + 32);
	}
}

const AUTH_KEY = Symbol('SOLYTO_AUTH');

export function setAuth(): Auth {
	return setContext(AUTH_KEY, new Auth());
}

export function getAuth(): Auth {
	return getContext<Auth>(AUTH_KEY);
}
