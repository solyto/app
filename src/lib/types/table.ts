export type TableView = 'list' | 'card';

export type TableColumnType =
	| 'text'
	| 'number'
	| 'date'
	| 'checkbox'
	| 'url'
	| 'select'
	| 'tags'
	| 'picture';

export interface TableColumn {
	id: string;
	name: string;
	type: TableColumnType;
	options: string[] | null;
	position: number;
}

export interface TableRowData {
	[columnId: string]: string | number | boolean | string[] | null;
}

export interface TableRow {
	id: string;
	data: TableRowData;
	position: number;
	created_at: string;
	updated_at: string;
}

export interface Table {
	id: string;
	name: string;
	icon: string | null;
	view: TableView;
	position: number;
	rows_count?: number;
	columns?: TableColumn[];
	rows?: TableRow[];
	created_at: string;
	updated_at: string;
}

export interface CreateTableRequest {
	name: string;
	icon?: string | null;
	view?: TableView;
}

export interface UpdateTableRequest {
	name?: string;
	icon?: string | null;
	view?: TableView;
}

export interface CreateTableColumnRequest {
	name: string;
	type: TableColumnType;
	options?: string[] | null;
}

export interface UpdateTableColumnRequest {
	name?: string;
	type?: TableColumnType;
	options?: string[] | null;
}

export interface CreateTableRowRequest {
	data: TableRowData;
}

export interface UpdateTableRowRequest {
	data: TableRowData;
}
