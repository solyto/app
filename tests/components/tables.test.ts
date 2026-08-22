import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { renderWithContext } from './helpers/context';
import CellValue from '$lib/components/tables/CellValue.svelte';
import TableCard from '$lib/components/tables/TableCard.svelte';
import RowListItem from '$lib/components/tables/RowListItem.svelte';
import RowCard from '$lib/components/tables/RowCard.svelte';
import RowModal from '$lib/components/tables/RowModal.svelte';
import ColumnModal from '$lib/components/tables/ColumnModal.svelte';
import TableModal from '$lib/components/tables/TableModal.svelte';
import DeleteTableModal from '$lib/components/tables/DeleteTableModal.svelte';
import type { Table, TableColumn } from '$lib/types/table';

function baseTable(overrides: Partial<Table> = {}): Table {
	return {
		id: 't1',
		name: 'Music Equipment',
		icon: null,
		view: 'list',
		position: 0,
		columns: [],
		rows: [],
		created_at: '',
		updated_at: '',
		...overrides
	};
}

function col(overrides: Partial<TableColumn>): TableColumn {
	return { id: 'c1', name: 'Title', type: 'text', options: null, position: 0, ...overrides };
}

describe('CellValue', () => {
	it('renders plain text', () => {
		renderWithContext(CellValue, {
			table: baseTable(),
			column: col({ type: 'text' }),
			value: 'Fender Stratocaster'
		});
		expect(screen.getByText('Fender Stratocaster')).toBeInTheDocument();
	});

	it('shows a fallback for an empty value', () => {
		renderWithContext(CellValue, {
			table: baseTable(),
			column: col({ type: 'text' }),
			value: null
		});
		expect(screen.getByText('—')).toBeInTheDocument();
	});

	it('renders a checked checkbox state', () => {
		const { container } = renderWithContext(CellValue, {
			table: baseTable(),
			column: col({ type: 'checkbox' }),
			value: true
		});
		expect(container.querySelector('svg')).toBeInTheDocument();
	});

	it('renders a url as a link', () => {
		renderWithContext(CellValue, {
			table: baseTable(),
			column: col({ type: 'url' }),
			value: 'https://example.com'
		});
		const link = screen.getByText('https://example.com').closest('a');
		expect(link).toHaveAttribute('href', 'https://example.com');
		expect(link).toHaveAttribute('target', '_blank');
	});

	it('renders tags as chips', () => {
		renderWithContext(CellValue, {
			table: baseTable(),
			column: col({ type: 'tags' }),
			value: ['vintage', 'guitar']
		});
		expect(screen.getByText('vintage')).toBeInTheDocument();
		expect(screen.getByText('guitar')).toBeInTheDocument();
	});

	it('renders a picture cell using the public user storage URL', () => {
		renderWithContext(
			CellValue,
			{
				table: baseTable({ id: 't1' }),
				column: col({ type: 'picture' }),
				value: 'abc.jpg'
			},
			{ stores: { auth: { user: { id: 'u1', settings: {} } } } }
		);
		const img = screen.getByAltText('Title') as HTMLImageElement;
		expect(img.src).toContain('/storage/user/u1/tables/t1/abc.jpg');
	});

	it('falls back to a placeholder for a picture column without a value', () => {
		renderWithContext(CellValue, {
			table: baseTable(),
			column: col({ type: 'picture' }),
			value: null
		});
		expect(screen.getByText('—')).toBeInTheDocument();
	});
});

describe('TableCard', () => {
	it('renders the table name and row count, and links to the detail page', () => {
		renderWithContext(TableCard, {
			table: baseTable({ rows_count: 3 }),
			onEdit: vi.fn(),
			onDelete: vi.fn()
		});
		expect(screen.getByText('Music Equipment')).toBeInTheDocument();
		expect(screen.getByText('3 entries')).toBeInTheDocument();
		expect(screen.getByRole('link')).toHaveAttribute('href', '/tables/t1');
	});

	it('fires onEdit and onDelete without navigating', async () => {
		const user = userEvent.setup();
		const onEdit = vi.fn();
		const onDelete = vi.fn();
		const { container } = renderWithContext(TableCard, {
			table: baseTable(),
			onEdit,
			onDelete
		});

		const buttons = container.querySelectorAll('button');
		await user.click(buttons[0]);
		await user.click(buttons[1]);

		expect(onEdit).toHaveBeenCalledTimes(1);
		expect(onDelete).toHaveBeenCalledTimes(1);
	});
});

describe('RowListItem', () => {
	it('renders a value per column with its label', () => {
		const table = baseTable({
			columns: [
				col({ id: 'c1', name: 'Title', type: 'text' }),
				col({ id: 'c2', name: 'Price', type: 'number' })
			]
		});
		renderWithContext(RowListItem, {
			table,
			row: {
				id: 'r1',
				data: { c1: 'Stratocaster', c2: 999 },
				position: 0,
				created_at: '',
				updated_at: ''
			},
			onEdit: vi.fn(),
			onDelete: vi.fn()
		});
		expect(screen.getByText('Title')).toBeInTheDocument();
		expect(screen.getByText('Stratocaster')).toBeInTheDocument();
		expect(screen.getByText('Price')).toBeInTheDocument();
		expect(screen.getByText('999')).toBeInTheDocument();
	});
});

describe('RowCard', () => {
	it('shows the picture column as the card image and the rest as fields', () => {
		const table = baseTable({
			id: 't1',
			columns: [
				col({ id: 'pic', name: 'Photo', type: 'picture' }),
				col({ id: 'c1', name: 'Title', type: 'text' })
			]
		});
		const { container } = renderWithContext(
			RowCard,
			{
				table,
				row: {
					id: 'r1',
					data: { pic: 'amp.jpg', c1: 'Stratocaster' },
					position: 0,
					created_at: '',
					updated_at: ''
				},
				onEdit: vi.fn(),
				onDelete: vi.fn()
			},
			{ stores: { auth: { user: { id: 'u1', settings: {} } } } }
		);

		const img = container.querySelector('img') as HTMLImageElement;
		expect(img.src).toContain('/storage/user/u1/tables/t1/amp.jpg');
		expect(screen.getByText('Stratocaster')).toBeInTheDocument();
		// the picture column itself must not also appear as a labelled field
		expect(screen.queryByText('Photo')).not.toBeInTheDocument();
	});

	it('renders without an image when there is no picture column', () => {
		const table = baseTable({ columns: [col({ id: 'c1', name: 'Title', type: 'text' })] });
		const { container } = renderWithContext(RowCard, {
			table,
			row: {
				id: 'r1',
				data: { c1: 'Stratocaster' },
				position: 0,
				created_at: '',
				updated_at: ''
			},
			onEdit: vi.fn(),
			onDelete: vi.fn()
		});
		expect(container.querySelector('img')).not.toBeInTheDocument();
	});
});

describe('RowModal', () => {
	it('creates a row with values collected from each column input', async () => {
		const user = userEvent.setup();
		const createRow = vi.fn();
		const table = baseTable({
			columns: [
				col({ id: 'c1', name: 'Title', type: 'text' }),
				col({ id: 'c2', name: 'Used', type: 'checkbox' })
			]
		});

		renderWithContext(
			RowModal,
			{ table, row: null, onClose: vi.fn() },
			{ stores: { tables: { createRow } } }
		);

		await user.type(screen.getByPlaceholderText('Title'), 'Stratocaster');
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByText('Confirm'));

		expect(createRow).toHaveBeenCalledWith(table, {
			data: { c1: 'Stratocaster', c2: true }
		});
	});

	it('pre-fills inputs from an existing row and updates it', async () => {
		const user = userEvent.setup();
		const updateRow = vi.fn();
		const table = baseTable({ columns: [col({ id: 'c1', name: 'Title', type: 'text' })] });
		const row = {
			id: 'r1',
			data: { c1: 'Old name' },
			position: 0,
			created_at: '',
			updated_at: ''
		};

		renderWithContext(
			RowModal,
			{ table, row, onClose: vi.fn() },
			{ stores: { tables: { updateRow } } }
		);

		const input = screen.getByPlaceholderText('Title') as HTMLInputElement;
		expect(input.value).toBe('Old name');

		await user.clear(input);
		await user.type(input, 'New name');
		await user.click(screen.getByText('Confirm'));

		expect(updateRow).toHaveBeenCalledWith(table, row, { data: { c1: 'New name' } });
	});
});

describe('ColumnModal', () => {
	it('creates a text column', async () => {
		const user = userEvent.setup();
		const createColumn = vi.fn();
		const table = baseTable();

		renderWithContext(
			ColumnModal,
			{ table, column: null, onClose: vi.fn() },
			{ stores: { tables: { createColumn } } }
		);

		await user.type(screen.getByPlaceholderText('e.g. Title'), 'Title');
		await user.click(screen.getByText('Confirm'));

		expect(createColumn).toHaveBeenCalledWith(table, {
			name: 'Title',
			type: 'text',
			options: null
		});
	});

	it('reveals an options editor for select columns and submits the entered options', async () => {
		const user = userEvent.setup();
		const createColumn = vi.fn();
		const table = baseTable();

		renderWithContext(
			ColumnModal,
			{ table, column: null, onClose: vi.fn() },
			{ stores: { tables: { createColumn } } }
		);

		await user.type(screen.getByPlaceholderText('e.g. Title'), 'Condition');
		await user.selectOptions(screen.getByRole('combobox'), 'select');

		await user.click(screen.getByText('+ Add option'));
		await user.type(screen.getByPlaceholderText('Option'), 'New');

		await user.click(screen.getByText('Confirm'));

		expect(createColumn).toHaveBeenCalledWith(table, {
			name: 'Condition',
			type: 'select',
			options: ['New']
		});
	});
});

describe('TableModal', () => {
	it('creates a table with the entered name', async () => {
		const user = userEvent.setup();
		const create = vi.fn().mockResolvedValue(baseTable());
		const onClose = vi.fn();

		renderWithContext(TableModal, { table: null, onClose }, { stores: { tables: { create } } });

		await user.type(screen.getByPlaceholderText('Table name'), 'Music Equipment');
		await user.click(screen.getByText('Confirm'));

		expect(create).toHaveBeenCalledWith({ name: 'Music Equipment' });
		expect(onClose).toHaveBeenCalled();
	});

	it('does not submit an empty name', async () => {
		const user = userEvent.setup();
		const create = vi.fn();

		renderWithContext(
			TableModal,
			{ table: null, onClose: vi.fn() },
			{ stores: { tables: { create } } }
		);
		await user.click(screen.getByText('Confirm'));

		expect(create).not.toHaveBeenCalled();
	});
});

describe('DeleteTableModal', () => {
	// Regression test: the detail page needs to tell confirm and cancel apart so
	// it can navigate away only after an actual delete, not on every close.
	it('deletes and calls onDeleted, but never onCancel, when confirmed', async () => {
		const user = userEvent.setup();
		const deleteFn = vi.fn();
		const onDeleted = vi.fn();
		const onCancel = vi.fn();

		renderWithContext(
			DeleteTableModal,
			{ table: baseTable(), onDeleted, onCancel },
			{ stores: { tables: { delete: deleteFn } } }
		);

		await user.click(screen.getByText('Confirm'));

		expect(deleteFn).toHaveBeenCalled();
		expect(onDeleted).toHaveBeenCalled();
		expect(onCancel).not.toHaveBeenCalled();
	});

	it('calls onCancel, but never deletes or calls onDeleted, when cancelled', async () => {
		const user = userEvent.setup();
		const deleteFn = vi.fn();
		const onDeleted = vi.fn();
		const onCancel = vi.fn();

		const { container } = renderWithContext(
			DeleteTableModal,
			{ table: baseTable(), onDeleted, onCancel },
			{ stores: { tables: { delete: deleteFn } } }
		);

		// on the (default, mobile-simulated) bottom-sheet variant, cancelling
		// happens through the icon-only close button, not a "Cancel" label
		const closeButton = container.querySelector('button') as HTMLButtonElement;
		await user.click(closeButton);

		expect(deleteFn).not.toHaveBeenCalled();
		expect(onDeleted).not.toHaveBeenCalled();
		expect(onCancel).toHaveBeenCalled();
	});
});
