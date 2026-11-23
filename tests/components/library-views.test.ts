import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import type { Auth } from '$lib/state/Auth.svelte';
import type ApiService from '$lib/services/ApiService';
import type LocalStorageService from '$lib/services/LocalStorageService';
import { BookLibrary } from '$lib/state/BookLibrary.svelte';
import CardsView from '$lib/components/libraries/shared/CardsView.svelte';
import ListView from '$lib/components/libraries/shared/ListView.svelte';
import Header from '$lib/components/libraries/shared/Header.svelte';
import ShelfView from '$lib/components/libraries/shared/ShelfView.svelte';
import Cover from '$lib/components/libraries/shared/Cover.svelte';
import ViewSwitcher from '$lib/components/libraries/shared/ViewSwitcher.svelte';
import { renderWithContext } from './helpers/context';
import { book } from '../unit/helpers/factories';

class LoadedImage {
	onload: (() => void) | null = null;
	private _src = '';
	set src(value: string) {
		this._src = value;
		this.onload?.();
	}
	get src() {
		return this._src;
	}
}

const storage = { get: vi.fn(() => null), set: vi.fn() } as unknown as LocalStorageService;

function renderWithLibrary(component: Parameters<typeof renderWithContext>[0], entries = [book({ id: 'b1', title: 'Dune', cover: 'dune.jpg' })]) {
	let library: BookLibrary | null = null;
	const result = renderWithContext(component, {}, {
		stores: { auth: { user: { id: 'u1' } } },
		prepare: (instances) => {
			library = new BookLibrary(instances.auth as Auth, {} as ApiService, storage);
			library.entries = entries;
			library.filteredEntries = entries;
			return { library };
		}
	});
	return { ...result, library: library! };
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('Library entry views', () => {
	it.each([
		['cards', CardsView],
		['list', ListView]
	])('opens the detail of a clicked entry in the %s view', async (_, View) => {
		const { library } = renderWithLibrary(View);
		const open = vi.spyOn(library, 'openDetailModal');

		await fireEvent.click(screen.getByRole('button', { name: /Dune/ }));

		expect(open).toHaveBeenCalledWith(library.entries[0]);
	});

	it('loads the cover and its preview from the user\'s storage folder', () => {
		vi.stubGlobal('Image', LoadedImage);
		const { container } = renderWithLibrary(CardsView);
		const sources = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? '');

		expect(sources.some((src) => src.endsWith('/u1/books/dune.jpg'))).toBe(true);
		expect(sources.some((src) => src.endsWith('/u1/books/dune_preview.jpg'))).toBe(true);
		expect(container.querySelector('img[alt="Cover"]')).not.toBeNull();
	});
});

describe('Library header', () => {
	it('shows how many entries the library has', () => {
		renderWithLibrary(Header, [book({ id: '1' }), book({ id: '2' })]);
		expect(screen.getByText('2 entries')).toBeInTheDocument();
	});
});

describe('Library shelf view', () => {
	it('moves between entries with the previous and next buttons', async () => {
		const { library } = renderWithLibrary(ShelfView, [book({ id: '1', title: 'Dune' }), book({ id: '2', title: 'Emma' })]);

		await fireEvent.click(screen.getByRole('button', { name: 'Next' }));
		expect(library.shelfIndex).toBe(1);

		await fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
		expect(library.shelfIndex).toBe(0);
	});
});

describe('Library cover', () => {
	it('describes the cover by the entry title', () => {
		renderWithContext(Cover, { entry: book({ title: 'Dune', cover: 'dune.jpg' }), library: { auth: { user: null }, config: { type: 'books' } } });
		expect(screen.getByAltText('Dune cover')).toBeInTheDocument();
	});
});

describe('Library view switcher', () => {
	it('offers the shelf views only for libraries with a shelf', () => {
		renderWithLibrary(ViewSwitcher);
		expect(['List', 'Cards', 'Shelf', 'Browse'].map((title) => screen.getByTitle(title))).toHaveLength(4);
	});
});
