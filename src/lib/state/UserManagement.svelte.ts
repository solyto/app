import { getContext, setContext } from 'svelte';
import { getAuth, type Auth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import type {
	ManagedUser,
	ManagedUserListMeta,
	UpdateUserRoleRequest,
	UserGrowthGroupBy,
	UserGrowthPoint
} from '$lib/types/managed_user';

export class UserManagement {
	static readonly PER_PAGE = 25;
	static readonly SEARCH_DELAY_MS = 300;
	static readonly SEARCH_MAX_LENGTH = 255;

	loaded = $state<boolean>(false);
	users = $state<ManagedUser[]>([]);
	search = $state<string>('');
	page = $state<number>(1);
	lastPage = $state<number>(1);
	total = $state<number>(0);
	growth = $state<UserGrowthPoint[]>([]);
	growthGroupBy = $state<UserGrowthGroupBy>('month');
	auth: Auth;
	apiService: ApiService;

	private searchTimer: ReturnType<typeof setTimeout> | undefined;
	private generation = 0;

	constructor(auth: Auth = getAuth(), apiService: ApiService = auth.apiService) {
		this.auth = auth;
		this.apiService = apiService;
	}

	async load(): Promise<void> {
		const generation = ++this.generation;
		const query = new URLSearchParams({ page: String(this.page), per_page: String(UserManagement.PER_PAGE) });
		if (this.search) query.set('search', this.search);
		const res = await this.apiService.list(`${apiRoutes.admin.users.list}?${query}`);
		if (!res || generation !== this.generation) return;

		const { pagination } = res.meta as ManagedUserListMeta;
		this.users = res.data as ManagedUser[];
		this.page = pagination.current_page;
		this.lastPage = pagination.last_page;
		this.total = pagination.total;
		this.loaded = true;
	}

	async loadGrowth(): Promise<void> {
		const query = new URLSearchParams({ group_by: this.growthGroupBy });
		const res = await this.apiService.list(`${apiRoutes.admin.users.growth}?${query}`);
		if (res) this.growth = res.data as UserGrowthPoint[];
	}

	async goToPage(page: number): Promise<void> {
		this.page = page;
		await this.load();
	}

	scheduleSearch(): void {
		clearTimeout(this.searchTimer);
		this.searchTimer = setTimeout(() => this.goToPage(1), UserManagement.SEARCH_DELAY_MS);
	}

	async clearSearch(): Promise<void> {
		clearTimeout(this.searchTimer);
		this.search = '';
		await this.goToPage(1);
	}

	async groupGrowthBy(groupBy: UserGrowthGroupBy): Promise<void> {
		this.growthGroupBy = groupBy;
		await this.loadGrowth();
	}

	async updateRole(user: ManagedUser, role: UpdateUserRoleRequest['role']): Promise<boolean> {
		const res = await this.apiService.update(apiRoutes.admin.users.update, user.id, { role });
		if (res) await this.load();
		return res;
	}

	destroy(): void {
		clearTimeout(this.searchTimer);
	}
}

const USER_MANAGEMENT_KEY = Symbol('SOLYTO_USER_MANAGEMENT');

export function setUserManagement(): UserManagement {
	return setContext(USER_MANAGEMENT_KEY, new UserManagement());
}

export function getUserManagement(): UserManagement {
	return getContext<UserManagement>(USER_MANAGEMENT_KEY);
}
