import type { CreateResponse, GetResponse, ListResponse, PostResponse } from '$lib/types/api';
import { apiRoutes } from '$lib/config/apiRoutes';
import { CLIENT_VERSION } from '$lib/config/platform';

// Endpoints where a 401 is a legitimate, expected auth failure (bad credentials,
// expired refresh token, failed passkey authentication) rather than a stale
// session. Recovery must never run for these, otherwise a failed login would
// trigger a refresh/logout loop.
const AUTH_ENDPOINTS: string[] = [
	apiRoutes.auth.login,
	apiRoutes.auth.refresh,
	apiRoutes.auth.register,
	apiRoutes.auth.verify,
	apiRoutes.auth.forgotPassword,
	apiRoutes.auth.resetPassword,
	apiRoutes.auth.passkeys.authenticateOptions,
	apiRoutes.auth.passkeys.authenticate
];

export default class ApiService {
	authToken: string | null = null;
	private unauthorizedHandler: (() => Promise<boolean>) | null = null;

	constructor(authToken: string | null = null) {
		this.authToken = authToken;
	}

	updateAuthToken(authToken: string | null): void {
		this.authToken = authToken;
	}

	setUnauthorizedHandler(handler: () => Promise<boolean>): void {
		this.unauthorizedHandler = handler;
	}

	private isAuthEndpoint(endpoint: string): boolean {
		return AUTH_ENDPOINTS.some((authEndpoint) => endpoint.startsWith(authEndpoint));
	}

	// Network errors (a rejected fetch) propagate untouched: they are transient
	// and must never trigger recovery or logout.
	private async fetchWithRecovery(
		endpoint: string,
		init: Omit<RequestInit, 'headers'>,
		buildHeaders: () => HeadersInit
	): Promise<Response> {
		const res = await fetch(endpoint, { ...init, headers: buildHeaders() });

		if (res.status !== 401 || !this.unauthorizedHandler || this.isAuthEndpoint(endpoint)) {
			return res;
		}

		const recovered = await this.unauthorizedHandler();
		if (!recovered) return res;

		return fetch(endpoint, { ...init, headers: buildHeaders() });
	}

	async list(endpoint: string): Promise<ListResponse | null> {
		const res = await this.fetchWithRecovery(endpoint, {}, () => this.getApiHeader());
		return res.ok ? await res.json() : null;
	}

	async get(endpoint: string, id: string | number | null): Promise<GetResponse | null> {
		if (typeof id === 'string') {
			endpoint = endpoint.replace('%s', id);
		} else if (typeof id === 'number') {
			endpoint = endpoint.replace('%d', id.toString());
		}

		const res = await this.fetchWithRecovery(endpoint, {}, () => this.getApiHeader());
		return res.ok ? await res.json() : null;
	}

	async create(endpoint: string, body: object): Promise<CreateResponse | null> {
		const res = await this.fetchWithRecovery(
			endpoint,
			{ method: 'POST', body: JSON.stringify(body) },
			() => this.getApiHeaderWithBody()
		);

		return res.ok ? await res.json() : null;
	}

	async createWithStatus(endpoint: string, body: object): Promise<{ ok: boolean; status: number }> {
		const res = await this.fetchWithRecovery(
			endpoint,
			{ method: 'POST', body: JSON.stringify(body) },
			() => this.getApiHeaderWithBody()
		);

		return { ok: res.ok, status: res.status };
	}

	async delete(endpoint: string, id: string | number): Promise<boolean> {
		const res = await this.fetchWithRecovery(
			typeof id === 'string'
				? endpoint.replace('%s', id)
				: endpoint.replace('%d', id.toString()),
			{ method: 'DELETE' },
			() => this.getApiHeader()
		);

		return Promise.resolve(res.ok);
	}

	async update(endpoint: string, id: string | number, body: object): Promise<boolean> {
		const res = await this.fetchWithRecovery(
			typeof id === 'string'
				? endpoint.replace('%s', id)
				: endpoint.replace('%d', id.toString()),
			{ method: 'PUT', body: JSON.stringify(body) },
			() => this.getApiHeaderWithBody()
		);

		return Promise.resolve(res.ok);
	}

	async post(endpoint: string, body: FormData | object): Promise<PostResponse | null> {
		const res = await this.fetchWithRecovery(
			endpoint,
			{ method: 'POST', body: typeof body === 'object' ? JSON.stringify(body) : body },
			() => (typeof body === 'object' ? this.getApiHeaderWithBody() : this.getApiHeader())
		);

		return res.ok ? await res.json() : null;
	}

	async postWithStatus(
		endpoint: string,
		body: FormData | object
	): Promise<
		{ ok: true; status: number; data: PostResponse } | { ok: false; status: number; data: null }
	> {
		const res = await this.fetchWithRecovery(
			endpoint,
			{ method: 'POST', body: typeof body === 'object' ? JSON.stringify(body) : body },
			() => (typeof body === 'object' ? this.getApiHeaderWithBody() : this.getApiHeader())
		);

		return res.ok
			? { ok: true, status: res.status, data: await res.json() }
			: { ok: false, status: res.status, data: null };
	}

	async getRaw<T = object>(endpoint: string): Promise<T | null> {
		const res = await this.fetchWithRecovery(endpoint, {}, () => this.getApiHeader());
		return res.ok ? await res.json() : null;
	}

	async postRaw<T = object>(endpoint: string, body: FormData | object): Promise<T> {
		const res = await this.fetchWithRecovery(
			endpoint,
			{ method: 'POST', body: typeof body === 'object' ? JSON.stringify(body) : body },
			() => (typeof body === 'object' ? this.getApiHeaderWithBody() : this.getApiHeader())
		);

		return await res.json() as Promise<T>;
	}

	async put(endpoint: string, body: FormData | object): Promise<boolean> {
		const res = await this.fetchWithRecovery(
			endpoint,
			{ method: 'PUT', body: typeof body === 'object' ? JSON.stringify(body) : body },
			() => (typeof body === 'object' ? this.getApiHeaderWithBody() : this.getApiHeader())
		);

		return res.ok;
	}

	async postFormData(endpoint: string, body: FormData): Promise<boolean> {
		const res = await this.fetchWithRecovery(
			endpoint,
			{ method: 'POST', body },
			() => this.getAuthHeaderOnly()
		);

		return res.ok ? await res.json() : false;
	}

	async uploadFile(endpoint: string, id: string, body: FormData): Promise<CreateResponse | null> {
		const res = await this.fetchWithRecovery(
			endpoint.replace('%s', id),
			{ method: 'POST', body },
			() => this.getAuthHeaderOnly()
		);
		return res.ok ? await res.json() : null;
	}

	async image(endpoint: string): Promise<Blob | null> {
		const res = await this.fetchWithRecovery(endpoint, {}, () => this.getApiHeader());
		return res.ok ? await res.blob() : null;
	}

	async download(endpoint: string, accept: string): Promise<Blob | null> {
		const res = await this.fetchWithRecovery(endpoint, {}, () => ({
			Authorization: 'Bearer ' + this.authToken,
			Accept: accept,
			...this.getClientVersionHeader()
		}));
		return res.ok ? await res.blob() : null;
	}

	private getAuthHeaderOnly(): HeadersInit {
		return { Authorization: 'Bearer ' + this.authToken, ...this.getClientVersionHeader() };
	}

	private getApiHeader(): HeadersInit {
		if (!this.authToken) {
			return { Accept: 'application/json', ...this.getClientVersionHeader() };
		}

		return {
			Authorization: 'Bearer ' + this.authToken,
			Accept: 'application/json',
			...this.getClientVersionHeader()
		};
	}

	private getApiHeaderWithBody(): HeadersInit {
		if (!this.authToken) {
			return {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...this.getClientVersionHeader()
			};
		}

		return {
			Authorization: 'Bearer ' + this.authToken,
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...this.getClientVersionHeader()
		};
	}

	// The API records the version on the auth token. A missing value is ignored
	// there, so the header is left out entirely when PUBLIC_VERSION is unset.
	private getClientVersionHeader(): Record<string, string> {
		return CLIENT_VERSION ? { 'X-Client-Version': CLIENT_VERSION } : {};
	}
}
