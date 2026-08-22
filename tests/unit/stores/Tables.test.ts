import { describe, it, expect, beforeEach } from 'vitest';
import { Tables } from '$lib/state/Tables.svelte';
import { api, resetStoreMocks } from '../setup/storeMocks';
import type { Table, TableColumn, TableRow } from '$lib/types/table';

beforeEach(() => {
	resetStoreMocks();
});

function table(id: string, name = 'Music Equipment'): Table {
	return {
		id,
		name,
		icon: null,
		view: 'list',
		position: 0,
		columns: [],
		rows: [],
		created_at: '',
		updated_at: ''
	};
}

function column(id: string): TableColumn {
	return { id, name: 'Title', type: 'text', options: null, position: 0 };
}

function row(id: string): TableRow {
	return { id, data: {}, position: 0, created_at: '', updated_at: '' };
}

describe('Tables store', () => {
	it('loads the table list', async () => {
		api.list.mockResolvedValue({ data: [table('t1')] });

		const t = new Tables();
		await t.load();

		expect(t.loaded).toBe(true);
		expect(t.tables).toHaveLength(1);
	});

	it('loads a single table with columns and rows', async () => {
		api.get.mockResolvedValue({ data: table('t1') });

		const t = new Tables();
		await t.loadTable('t1');

		expect(t.activeTableLoaded).toBe(true);
		expect(t.activeTable?.id).toBe('t1');
	});

	it('creates a table and reloads the list', async () => {
		api.create.mockResolvedValue({ data: table('t1') });
		api.list.mockResolvedValue({ data: [table('t1')] });

		const t = new Tables();
		const created = await t.create({ name: 'Music Equipment' });

		expect(created?.id).toBe('t1');
		expect(api.create).toHaveBeenCalledWith(expect.stringContaining('/tables'), {
			name: 'Music Equipment'
		});
		expect(t.tables).toHaveLength(1);
	});

	it('deletes a table and reloads', async () => {
		api.delete.mockResolvedValue(true);
		api.list.mockResolvedValue({ data: [] });

		const t = new Tables();
		await t.delete(table('t1'));

		expect(api.delete).toHaveBeenCalledWith(expect.stringContaining('/tables'), 't1');
		expect(t.tables).toHaveLength(0);
	});

	it('creates a column against the nested endpoint and reloads the table', async () => {
		api.create.mockResolvedValue({ data: column('c1') });
		api.get.mockResolvedValue({ data: table('t1') });

		const t = new Tables();
		await t.createColumn(table('t1'), { name: 'Title', type: 'text' });

		expect(api.create).toHaveBeenCalledWith(expect.stringContaining('/tables/t1/columns'), {
			name: 'Title',
			type: 'text'
		});
		expect(t.activeTableLoaded).toBe(true);
	});

	it('updates a column by substituting both the table and column ids', async () => {
		api.update.mockResolvedValue(true);
		api.get.mockResolvedValue({ data: table('t1') });

		const t = new Tables();
		await t.updateColumn(table('t1'), column('c1'), { name: 'Renamed' });

		expect(api.update).toHaveBeenCalledWith(
			expect.stringContaining('/tables/t1/columns/%s'),
			'c1',
			{ name: 'Renamed' }
		);
	});

	it('deletes a column by substituting both ids', async () => {
		api.delete.mockResolvedValue(true);
		api.get.mockResolvedValue({ data: table('t1') });

		const t = new Tables();
		await t.deleteColumn(table('t1'), column('c1'));

		expect(api.delete).toHaveBeenCalledWith(
			expect.stringContaining('/tables/t1/columns/%s'),
			'c1'
		);
	});

	it('creates a row against the nested endpoint', async () => {
		api.create.mockResolvedValue({ data: row('r1') });
		api.get.mockResolvedValue({ data: table('t1') });

		const t = new Tables();
		await t.createRow(table('t1'), { data: { c1: 'Fender Stratocaster' } });

		expect(api.create).toHaveBeenCalledWith(expect.stringContaining('/tables/t1/rows'), {
			data: { c1: 'Fender Stratocaster' }
		});
	});

	it('updates a row by substituting both ids', async () => {
		api.update.mockResolvedValue(true);
		api.get.mockResolvedValue({ data: table('t1') });

		const t = new Tables();
		await t.updateRow(table('t1'), row('r1'), { data: { c1: 'Gibson Les Paul' } });

		expect(api.update).toHaveBeenCalledWith(
			expect.stringContaining('/tables/t1/rows/%s'),
			'r1',
			{ data: { c1: 'Gibson Les Paul' } }
		);
	});

	it('uploads an image for a picture cell', async () => {
		api.uploadFile.mockResolvedValue({ data: { file_name: 'abc.jpg' } });

		const t = new Tables();
		const file = new File(['x'], 'amp.jpg', { type: 'image/jpeg' });
		const fileName = await t.uploadImage(table('t1'), file);

		expect(fileName).toBe('abc.jpg');
		expect(api.uploadFile).toHaveBeenCalledWith(
			expect.stringContaining('/tables/%s/images'),
			't1',
			expect.any(FormData)
		);
	});

	it('returns null when the image upload fails', async () => {
		api.uploadFile.mockResolvedValue(null);

		const t = new Tables();
		const file = new File(['x'], 'amp.jpg', { type: 'image/jpeg' });
		await expect(t.uploadImage(table('t1'), file)).resolves.toBeNull();
	});
});
