import { setContext, getContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import type {
	CreateTableColumnRequest,
	CreateTableRequest,
	CreateTableRowRequest,
	Table,
	TableColumn,
	TableRow,
	UpdateTableColumnRequest,
	UpdateTableRequest,
	UpdateTableRowRequest
} from '$lib/types/table';

export class Tables {
	loaded = $state<boolean>(false);
	tables = $state<Table[]>([]);
	activeTable = $state<Table | null>(null);
	activeTableLoaded = $state<boolean>(false);
	auth = getAuth();
	apiService: ApiService;

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());
	}

	async load(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.tables.list);
		if (res) {
			this.tables = res.data as Table[];
			this.loaded = true;
		}
	}

	async loadTable(id: string): Promise<void> {
		this.activeTableLoaded = false;
		const res = await this.apiService.get(apiRoutes.tables.get, id);
		if (res) {
			this.activeTable = res.data as Table;
			this.activeTableLoaded = true;
		}
	}

	async create(request: CreateTableRequest): Promise<Table | null> {
		const res = await this.apiService.create(apiRoutes.tables.create, request);
		if (res) await this.load();
		return res ? (res.data as Table) : null;
	}

	async update(table: Table, request: UpdateTableRequest): Promise<void> {
		const ok = await this.apiService.update(apiRoutes.tables.update, table.id, request);
		if (ok) {
			await this.load();
			if (this.activeTable?.id === table.id) await this.loadTable(table.id);
		}
	}

	async delete(table: Table): Promise<void> {
		const ok = await this.apiService.delete(apiRoutes.tables.delete, table.id);
		if (ok) {
			await this.load();
			if (this.activeTable?.id === table.id) this.activeTable = null;
		}
	}

	async reorder(ids: string[]): Promise<void> {
		await this.apiService.put(apiRoutes.tables.reorder, { ids });
		await this.load();
	}

	async createColumn(table: Table, request: CreateTableColumnRequest): Promise<void> {
		const endpoint = apiRoutes.tables.createColumn.replace('%s', table.id);
		const res = await this.apiService.create(endpoint, request);
		if (res) await this.loadTable(table.id);
	}

	async updateColumn(
		table: Table,
		column: TableColumn,
		request: UpdateTableColumnRequest
	): Promise<void> {
		const endpoint = apiRoutes.tables.updateColumn.replace('%s', table.id);
		const ok = await this.apiService.update(endpoint, column.id, request);
		if (ok) await this.loadTable(table.id);
	}

	async deleteColumn(table: Table, column: TableColumn): Promise<void> {
		const endpoint = apiRoutes.tables.deleteColumn.replace('%s', table.id);
		const ok = await this.apiService.delete(endpoint, column.id);
		if (ok) await this.loadTable(table.id);
	}

	async reorderColumns(table: Table, ids: string[]): Promise<void> {
		const endpoint = apiRoutes.tables.reorderColumns.replace('%s', table.id);
		await this.apiService.put(endpoint, { ids });
		await this.loadTable(table.id);
	}

	async createRow(table: Table, request: CreateTableRowRequest): Promise<void> {
		const endpoint = apiRoutes.tables.createRow.replace('%s', table.id);
		const res = await this.apiService.create(endpoint, request);
		if (res) await this.loadTable(table.id);
	}

	async updateRow(table: Table, row: TableRow, request: UpdateTableRowRequest): Promise<void> {
		const endpoint = apiRoutes.tables.updateRow.replace('%s', table.id);
		const ok = await this.apiService.update(endpoint, row.id, request);
		if (ok) await this.loadTable(table.id);
	}

	async deleteRow(table: Table, row: TableRow): Promise<void> {
		const endpoint = apiRoutes.tables.deleteRow.replace('%s', table.id);
		const ok = await this.apiService.delete(endpoint, row.id);
		if (ok) await this.loadTable(table.id);
	}

	async reorderRows(table: Table, ids: string[]): Promise<void> {
		const endpoint = apiRoutes.tables.reorderRows.replace('%s', table.id);
		await this.apiService.put(endpoint, { ids });
		await this.loadTable(table.id);
	}

	async uploadImage(table: Table, file: File): Promise<string | null> {
		const formData = new FormData();
		formData.append('image', file);
		const res = await this.apiService.uploadFile(
			apiRoutes.tables.uploadImage,
			table.id,
			formData
		);
		if (!res) return null;
		return (res.data as { file_name: string }).file_name;
	}
}

const TABLES_KEY = Symbol('SOLYTO_TABLES');

export function setTables(): Tables {
	return setContext(TABLES_KEY, new Tables());
}

export function getTables(): Tables {
	return getContext<Tables>(TABLES_KEY);
}
