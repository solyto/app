import type {
	AuthToken,
	User,
	UserSettings,
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	VerifyRequest,
	AuthActionResponse,
	VerifyActionResponse,
	PasskeyActionResponse,
	PasskeyAuthenticationOptions,
	PasskeyRegistrationOptions,
	Passkey
} from '$lib/types/auth';
import { IS_NATIVE, PLATFORM } from '$lib/config/platform';
import { browser } from '$app/environment';
import { setContext, getContext } from 'svelte';
import { apiRoutes } from '$lib/config/apiRoutes';
import ApiService from '$lib/services/ApiService';
import LocalStorageService from '$lib/services/LocalStorageService';
import { SvelteDate, SvelteMap } from 'svelte/reactivity';
import {
	formatDate,
	formatDateTime,
	formatDateWithoutYear,
	formatDateWithWeekday,
	formatTime,
	formatTimeWithSeconds
} from '$lib/helpers/DateHelper';

// How often a visible, permanently-open app re-validates its session.
const SESSION_CHECK_INTERVAL_MS = 60 * 60 * 1000;

// Outcome of a refresh attempt:
// - refreshed: a new token was obtained.
// - transient: the server/network failed (5xx, 429, offline) — keep the session.
// - rejected: the refresh endpoint definitively rejected the token (401/403).
type RefreshOutcome = 'refreshed' | 'transient' | 'rejected';

export class Auth {
	static readonly LS_AUTH_KEY: string = 'auth';

	loggedIn = $state<boolean>(false);
	authToken = $state<AuthToken | null>(null);
	user = $state<User | null>(null);
	apiService: ApiService;
	localStorage = new LocalStorageService();
	profileCache = new SvelteMap<string, User>();
	private refreshInFlight: Promise<RefreshOutcome> | null = null;
	private recoveryInFlight: Promise<boolean> | null = null;
	private sessionCheckInterval: ReturnType<typeof setInterval> | null = null;
	private visibilityHandler: (() => void) | null = null;
	private onlineHandler: (() => void) | null = null;

	constructor() {
		this.apiService = new ApiService(null);
		// ApiService asks back here when any request hits a 401; the handler
		// adopts another tab's token or refreshes this session, last resort logout.
		this.apiService.setUnauthorizedHandler(() => this.recoverFromUnauthorized());
		this.load().then();
		this.startSessionMonitor();
	}

	private async load(): Promise<void> {
		const savedAuth = this.localStorage.getJson(Auth.LS_AUTH_KEY);

		if (!savedAuth) return;

		const { user, authToken } = savedAuth as { user: User; authToken: AuthToken }

		if (!authToken || !user) return;

		const expiresAt = new SvelteDate(authToken.expires_at).getTime();

		if (expiresAt > Date.now()) {
			this.user = user;
			this.authToken = authToken;
			this.apiService.updateAuthToken(this.getToken()!);
			this.loggedIn = true;

			if (this.shouldRefresh(expiresAt)) {
				await this.refresh();
			}

			await this.loadAdditionalData();

			this.save();
		} else {
			this.localStorage.destroy(Auth.LS_AUTH_KEY);
		}
	}

	public async loadAdditionalData(): Promise<void> {
		if (!this.user) return;
		const res = await this.apiService.get(apiRoutes.users.get, null);
		if (res) this.user = res.data as User;
		this.save();
	}

	public save(): void {
		this.localStorage.setJson(Auth.LS_AUTH_KEY, {
			user: this.user,
			authToken: this.authToken
		});
	}

	private clear(): void {
		this.localStorage.destroy(Auth.LS_AUTH_KEY);
		this.user = null;
		this.authToken = null;
		this.loggedIn = false;
		// Every store shares this ApiService instance, so clearing it here makes
		// sure no request keeps sending the revoked token.
		this.apiService.updateAuthToken(null);
	}

	async login(email: string, password: string): Promise<boolean> {
		const request: LoginRequest = { email, password, platform: PLATFORM };
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
		this.apiService.updateAuthToken(this.getToken()!);

		this.save();
		await this.loadAdditionalData();

		return Promise.resolve(true);
	}

	private shouldRefresh(expiresAt: number): boolean {
		const thresholdDays = IS_NATIVE ? 14 : 5;
		return expiresAt < Date.now() + thresholdDays * 24 * 60 * 60 * 1000;
	}

	async refresh(): Promise<RefreshOutcome> {
		// Single-flight: concurrent 401 recoveries and the resume check share one
		// refresh request instead of racing each other with the same token.
		if (this.refreshInFlight) return this.refreshInFlight;

		this.refreshInFlight = this.performRefresh().finally(() => {
			this.refreshInFlight = null;
		});

		return this.refreshInFlight;
	}

	private async performRefresh(): Promise<RefreshOutcome> {
		this.apiService.updateAuthToken(this.getToken());
		const res = await this.apiService.postWithStatus(apiRoutes.auth.refresh, {});

		if (!res.ok) {
			// Only 401/403 means the session is really over. A 5xx/429 (or any
			// other non-auth status) is a transient backend failure and must not
			// destroy the stored session — resume/online re-checks will retry.
			return res.status === 401 || res.status === 403 ? 'rejected' : 'transient';
		}

		const refresh = res.data?.data as LoginResponse;

		this.user = refresh.user;
		this.authToken = {
			token: refresh.token,
			token_type: refresh.token_type,
			expires_at: refresh.token_expires_at
		};
		this.loggedIn = true;
		this.apiService.updateAuthToken(this.getToken());

		this.save();

		return 'refreshed';
	}

	logout(): void {
		this.clear();
	}

	/**
	 * Recovery ladder for a 401 from a non-auth endpoint, invoked by ApiService.
	 * Returns true when the request is worth retrying with the (new) token.
	 */
	async recoverFromUnauthorized(): Promise<boolean> {
		if (this.recoveryInFlight) return this.recoveryInFlight;

		this.recoveryInFlight = this.performRecovery().finally(() => {
			this.recoveryInFlight = null;
		});

		return this.recoveryInFlight;
	}

	private async performRecovery(): Promise<boolean> {
		// (a) Another tab may already have refreshed the persisted session;
		// adopt its token rather than racing it with our own refresh.
		if (this.adoptExternalSession()) return true;

		// (b) Refresh this session (single-flight).
		try {
			const outcome = await this.refresh();
			if (outcome === 'refreshed') return true;
			// (c) Only a definitive auth rejection ends the session; a transient
			// backend failure keeps it and the resume/online checks retry.
			if (outcome === 'rejected') this.logout();
		} catch {
			// Transient network error while refreshing: keep the session, the
			// resume/online checks re-validate once the network is back.
		}

		return false;
	}

	private adoptExternalSession(): boolean {
		const savedAuth = this.localStorage.getJson(Auth.LS_AUTH_KEY) as
			| { user: User; authToken: AuthToken }
			| null;

		if (!savedAuth?.authToken?.token || !savedAuth.user) return false;
		if (savedAuth.authToken.token === this.getToken()) return false;
		if (new SvelteDate(savedAuth.authToken.expires_at).getTime() <= Date.now()) return false;

		this.user = savedAuth.user;
		this.authToken = savedAuth.authToken;
		this.loggedIn = true;
		this.apiService.updateAuthToken(savedAuth.authToken.token);

		return true;
	}

	private startSessionMonitor(): void {
		if (!browser || this.visibilityHandler) return;

		this.visibilityHandler = () => {
			if (document.hidden) {
				this.stopSessionCheckInterval();
			} else {
				this.validateSession();
				this.startSessionCheckInterval();
			}
		};

		this.onlineHandler = () => {
			this.validateSession();
		};

		document.addEventListener('visibilitychange', this.visibilityHandler);
		window.addEventListener('online', this.onlineHandler);

		if (!document.hidden) this.startSessionCheckInterval();
	}

	private startSessionCheckInterval(): void {
		this.stopSessionCheckInterval();
		this.sessionCheckInterval = setInterval(
			() => this.validateSession(),
			SESSION_CHECK_INTERVAL_MS
		);
	}

	private stopSessionCheckInterval(): void {
		if (this.sessionCheckInterval !== null) {
			clearInterval(this.sessionCheckInterval);
			this.sessionCheckInterval = null;
		}
	}

	/**
	 * Re-validates the session when the app resumes (visibility/online) and on a
	 * low-frequency interval. The routine case is a local date comparison; only a
	 * near/expired token triggers a network refresh, followed by a user re-fetch
	 * so the in-memory profile (incl. the image path) stays current.
	 */
	private async validateSession(): Promise<void> {
		if (!this.loggedIn || !this.authToken) return;

		try {
			const expiresAt = new SvelteDate(this.authToken.expires_at).getTime();

			if (expiresAt <= Date.now() || this.shouldRefresh(expiresAt)) {
				const outcome = await this.refresh();

				// Only a definitive auth rejection ends the session here.
				if (outcome === 'rejected') {
					this.logout();
					return;
				}

				// Transient backend failure — leave the session alone, re-check on
				// the next resume/online event.
				if (outcome === 'transient') return;
			}

			await this.loadAdditionalData();
		} catch {
			// Offline or a rejected fetch while resuming: transient, never log out.
			// The `online` event (and the next resume) re-runs this check.
		}
	}

	isAdmin(): boolean {
		return this.user?.role === 'admin' || this.user?.role === 'super_admin';
	}

	async register(request: RegisterRequest): Promise<AuthActionResponse> {
		return this.apiService.postRaw<AuthActionResponse>(apiRoutes.auth.register, request);
	}

	async verify(request: VerifyRequest): Promise<VerifyActionResponse> {
		return this.apiService.postRaw<VerifyActionResponse>(apiRoutes.auth.verify, request);
	}

	async forgotPassword(email: string, platform: string): Promise<void> {
		await this.apiService.post(apiRoutes.auth.forgotPassword, { email, platform });
	}

	async resetPassword(token: string, email: string, password: string, passwordConfirmation: string): Promise<AuthActionResponse> {
		return this.apiService.postRaw<AuthActionResponse>(apiRoutes.auth.resetPassword, {
			token,
			email,
			password,
			password_confirmation: passwordConfirmation
		});
	}

	async passkeyAuthenticationOptions(): Promise<PasskeyAuthenticationOptions | null> {
		const res = await this.apiService.post(apiRoutes.auth.passkeys.authenticateOptions, {});
		return (res?.data ?? null) as PasskeyAuthenticationOptions | null;
	}

	async passkeyAuthenticate(response: object): Promise<void> {
		const res = await this.apiService.postRaw<PasskeyActionResponse>(apiRoutes.auth.passkeys.authenticate, { response, platform: PLATFORM });
		if (!res.success) {
			throw new Error(res.message ?? 'Passkey authentication failed');
		}
		const data = res.data as LoginResponse;
		this.user = data.user;
		this.authToken = {
			token: data.token,
			token_type: data.token_type,
			expires_at: data.token_expires_at
		};
		this.loggedIn = true;
		this.apiService.updateAuthToken(this.getToken()!);
		this.save();
		await this.loadAdditionalData();
	}

	async passkeyRegistrationOptions(): Promise<PasskeyRegistrationOptions | null> {
		const res = await this.apiService.post(apiRoutes.auth.passkeys.registerOptions, {});
		return (res?.data ?? null) as PasskeyRegistrationOptions | null;
	}

	async passkeyRegister(response: object, name: string): Promise<void> {
		const res = await this.apiService.postRaw<PasskeyActionResponse>(apiRoutes.auth.passkeys.register, { response, name });
		if (!res.success) {
			throw new Error(res.message ?? 'Registration failed');
		}
	}

	async getPasskeys(): Promise<Passkey[]> {
		const res = await this.apiService.get(apiRoutes.auth.passkeys.list, null);
		return (res?.data ?? []) as Passkey[];
	}

	async deletePasskey(id: string): Promise<void> {
		await this.apiService.delete(apiRoutes.auth.passkeys.delete, id);
	}

	async renamePasskey(id: string, name: string): Promise<void> {
		await this.apiService.update(apiRoutes.auth.passkeys.update, id, { name });
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

	private async updateBooleanSetting(
		endpoint: string,
		enabled: boolean,
		apply: (settings: UserSettings) => void
	): Promise<boolean> {
		const res = await this.apiService.put(endpoint, { enabled });
		if (res && this.user?.settings) {
			apply(this.user.settings);
			this.save();
		}
		return Promise.resolve(res);
	}

	async updateJournalEnabled(enabled: boolean): Promise<boolean> {
		return this.updateBooleanSetting(
			apiRoutes.users.settings.updateJournal,
			enabled,
			(settings) => (settings.journal_enabled = enabled)
		);
	}

	async updateJournalCalendarMark(enabled: boolean): Promise<boolean> {
		return this.updateBooleanSetting(
			apiRoutes.users.settings.updateJournalCalendarMark,
			enabled,
			(settings) => (settings.journal_calendar_mark = enabled)
		);
	}

	async updateCheckInCalendarMark(enabled: boolean): Promise<boolean> {
		return this.updateBooleanSetting(
			apiRoutes.users.settings.updateCheckInCalendarMark,
			enabled,
			(settings) => (settings.check_in_calendar_mark = enabled)
		);
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
		return formatDateWithWeekday(input, this?.user?.settings?.date_format ?? null, this?.user?.settings?.language ?? undefined);
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
