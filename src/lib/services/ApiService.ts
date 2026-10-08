import type { CreateResponse, GetResponse, ListResponse, PostResponse } from '$lib/types/api';
import { apiRoutes } from '$lib/config/apiRoutes';

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

	// The owner of the session (Auth) registers a single recovery routine here.
	// It is expected to adopt a token refreshed by another tab, or refresh this
	// session, and return true when a retry with a fresh token makes sense.
	setUnauthorizedHandler(handler: () => Promise<boolean>): void {
		this.unauthorizedHandler = handler;
	}

	private isAuthEndpoint(endpoint: string): boolean {
		return AUTH_ENDPOINTS.some((authEndpoint) => endpoint.startsWith(authEndpoint));
	}

	// Runs a request; on a 401 from a non-auth endpoint asks the session owner
	// to recover and, if it did, retries the same request exactly once with the
	// current token. Network errors (a rejected fetch) propagate untouched — they
	// are transient and must never trigger recovery/logout.
	private async fetchWithRecovery(endpoint: string, init: RequestInit): Promise<Response> {
		const res = await fetch(endpoint, init);

		if (res.status !== 401 || !this.unauthorizedHandler || this.isAuthEndpoint(endpoint)) {
			return res;
		}

		const recovered = await this.unauthorizedHandler();
		if (!recovered) return res;

		const headers = { ...(init.headers as Record<string, string>) };
		if (this.authToken) {
			headers['Authorization'] = 'Bearer ' + this.authToken;
		} else {
			delete headers['Authorization'];
		}

		return fetch(endpoint, { ...init, headers });
	}

	async list(endpoint: string): Promise<ListResponse | null> {
		const res = await this.fetchWithRecovery(endpoint, { headers: this.getApiHeader() });
		return res.ok ? await res.json() : null;
	}

	async get(endpoint: string, id: string | number | null): Promise<GetResponse | null> {
		if (typeof id === 'string') {
			endpoint = endpoint.replace('%s', id);
		} else if (typeof id === 'number') {
			endpoint = endpoint.replace('%d', id.toString());
		}

		const res = await this.fetchWithRecovery(endpoint, { headers: this.getApiHeader() });
		return res.ok ? await res.json() : null;
	}

	async create(endpoint: string, body: object): Promise<CreateResponse | null> {
		const res = await this.fetchWithRecovery(endpoint, {
			method: 'POST',
			headers: this.getApiHeaderWithBody(),
			body: JSON.stringify(body)
		});

		return res.ok ? await res.json() : null;
	}

	async createWithStatus(endpoint: string, body: object): Promise<{ ok: boolean; status: number }> {
		const res = await this.fetchWithRecovery(endpoint, {
			method: 'POST',
			headers: this.getApiHeaderWithBody(),
			body: JSON.stringify(body)
		});

		return { ok: res.ok, status: res.status };
	}

	async delete(endpoint: string, id: string | number): Promise<boolean> {
		const res = await this.fetchWithRecovery(
			typeof id === 'string'
				? endpoint.replace('%s', id)
				: endpoint.replace('%d', id.toString()),
			{ method: 'DELETE', headers: this.getApiHeader() }
		);

		return Promise.resolve(res.ok);
	}

	async update(endpoint: string, id: string | number, body: object): Promise<boolean> {
		const res = await this.fetchWithRecovery(
			typeof id === 'string'
				? endpoint.replace('%s', id)
				: endpoint.replace('%d', id.toString()),
			{ method: 'PUT', headers: this.getApiHeaderWithBody(), body: JSON.stringify(body) }
		);

		return Promise.resolve(res.ok);
	}

	async post(endpoint: string, body: FormData | object): Promise<PostResponse | null> {
		const res = await this.fetchWithRecovery(endpoint, {
			method: 'POST',
			headers: typeof body === 'object' ? this.getApiHeaderWithBody() : this.getApiHeader(),
			body: typeof body === 'object' ? JSON.stringify(body) : body
		});

		return res.ok ? await res.json() : null;
	}

	// Like post(), but keeps the HTTP status so callers can tell a definitive
	// rejection (401/403) apart from a transient failure (5xx/429/...).
	async postWithStatus(
		endpoint: string,
		body: FormData | object
	): Promise<{ ok: boolean; status: number; data: PostResponse | null }> {
		const res = await this.fetchWithRecovery(endpoint, {
			method: 'POST',
			headers: typeof body === 'object' ? this.getApiHeaderWithBody() : this.getApiHeader(),
			body: typeof body === 'object' ? JSON.stringify(body) : body
		});

		return { ok: res.ok, status: res.status, data: res.ok ? await res.json() : null };
	}

	async postRaw<T = object>(endpoint: string, body: FormData | object): Promise<T> {
		const res = await this.fetchWithRecovery(endpoint, {
			method: 'POST',
			headers: typeof body === 'object' ? this.getApiHeaderWithBody() : this.getApiHeader(),
			body: typeof body === 'object' ? JSON.stringify(body) : body
		});

		return await res.json() as Promise<T>;
	}

	async put(endpoint: string, body: FormData | object): Promise<boolean> {
		const res = await this.fetchWithRecovery(endpoint, {
			method: 'PUT',
			headers: typeof body === 'object' ? this.getApiHeaderWithBody() : this.getApiHeader(),
			body: typeof body === 'object' ? JSON.stringify(body) : body
		});

		return res.ok;
	}

	async postFormData(endpoint: string, body: FormData): Promise<boolean> {
		const res = await this.fetchWithRecovery(endpoint, {
			method: 'POST',
			headers: this.getAuthHeaderOnly(),
			body: body
		});

		return res.ok ? await res.json() : false;
	}

	async uploadFile(endpoint: string, id: string, body: FormData): Promise<CreateResponse | null> {
		const res = await this.fetchWithRecovery(endpoint.replace('%s', id), {
			method: 'POST',
			headers: this.getAuthHeaderOnly(),
			body
		});
		return res.ok ? await res.json() : null;
	}

	async image(endpoint: string): Promise<Blob | null> {
		const res = await this.fetchWithRecovery(endpoint, { headers: this.getApiHeader() });
		return res.ok ? await res.blob() : null;
	}

	private getAuthHeaderOnly(): HeadersInit {
		return { Authorization: 'Bearer ' + this.authToken };
	}

	private getApiHeader(): HeadersInit {
		if (!this.authToken) {
			return { Accept: 'application/json' };
		}

		return { Authorization: 'Bearer ' + this.authToken, Accept: 'application/json' };
	}

	private getApiHeaderWithBody(): HeadersInit {
		if (!this.authToken) {
			return { 'Content-Type': 'application/json', Accept: 'application/json' };
		}

		return {
			Authorization: 'Bearer ' + this.authToken,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		};
	}
}
