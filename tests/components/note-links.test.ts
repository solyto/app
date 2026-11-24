import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Editor } from '@tiptap/core';
import { setNotes, type NotesSvelte as Notes } from '$lib/state/Notes.svelte';
import { setTags } from '$lib/state/Tags.svelte';
import type { KeyManager } from '$lib/state/KeyManager.svelte';
import { en } from '$lib/i18n/en';
import { renderWithContext, type AnyComponent } from './helpers/context';
import StoreHarness from './helpers/StoreHarness.svelte';
import NoteLinkModal from '$lib/components/notes/editor/NoteLinkModal.svelte';
import LinkBubbleMenu from '$lib/components/notes/editor/LinkBubbleMenu.svelte';
import NoteBacklinks from '$lib/components/notes/NoteBacklinks.svelte';
import { note, noteCategory } from '../unit/helpers/factories';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const UUID = '9b2f6c1e-4a7d-4e2b-9f3a-1c2d3e4f5a6b';

type Rendered = { notes: Notes; keyManager: KeyManager };

function renderWithNotes(
	component: AnyComponent,
	props: Record<string, unknown>,
	setup: (notes: Notes) => void = () => {}
): Rendered {
	const rendered = {} as Rendered;
	renderWithContext(
		StoreHarness,
		{
			component,
			props,
			provide: () => {
				setTags();
				return setNotes();
			},
			onReady: (notes: Notes) => {
				setup(notes);
				rendered.notes = notes;
			}
		},
		{ onReady: (stores) => (rendered.keyManager = stores.keyManager as KeyManager) }
	);
	return rendered;
}

function press(keyManager: KeyManager, key: string): void {
	keyManager.handleKeyDown(new KeyboardEvent('keydown', { key }));
}

describe('Note link picker', () => {
	const current = note({ id: 'n1', title: 'Current milk note' });
	const groceries = note({ id: 'n2', title: 'Groceries', category_id: 3 });
	const milk = note({ id: 'n3', title: 'Milk prices' });
	const journal = note({ id: 'n4', title: 'Milk journal', category_id: 9 });
	const secret = note({ id: 'n5', title: 'Milk secret' });

	function renderPicker(): Rendered & { onpick: ReturnType<typeof vi.fn> } {
		const onpick = vi.fn();
		const rendered = renderWithNotes(NoteLinkModal, { onpick, onCancel: vi.fn() }, (notes) => {
			notes.notes = [current, groceries, milk, journal, secret];
			notes.hiddenNoteIds = [secret.id];
			notes.categories = [noteCategory(3, { title: 'Home' })];
			notes.journalCategory = noteCategory(9, { title: 'Journal', is_system: true });
			notes.activeNote = current;
		});
		return { ...rendered, onpick };
	}

	it('offers visible notes only, without the current, hidden and journal notes', async () => {
		renderPicker();

		expect(await screen.findByRole('button', { name: /Groceries/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Milk prices/ })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Current milk note/ })).toBeNull();
		expect(screen.queryByRole('button', { name: /Milk journal/ })).toBeNull();
		expect(screen.queryByRole('button', { name: /Milk secret/ })).toBeNull();
	});

	it('shows the category next to the title', async () => {
		renderPicker();

		expect(await screen.findByRole('button', { name: /Groceries\s*Home/ })).toBeInTheDocument();
	});

	it('filters by title while typing and says so when nothing matches', async () => {
		renderPicker();
		const input = await screen.findByPlaceholderText(en.notes.search_placeholder);

		await userEvent.type(input, 'milk');
		expect(screen.getByRole('button', { name: /Milk prices/ })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Groceries/ })).toBeNull();

		await userEvent.type(input, 'xyz');
		expect(screen.getByText(en.notes.no_search_results)).toBeInTheDocument();
	});

	it('picks the highlighted note with the arrow keys and Enter', async () => {
		const { keyManager, onpick } = renderPicker();
		await screen.findByRole('button', { name: /Groceries/ });

		press(keyManager, 'ArrowDown');
		press(keyManager, 'Enter');

		expect(onpick).toHaveBeenCalledWith(milk);
	});

	it('picks a note on click', async () => {
		const { onpick } = renderPicker();

		await fireEvent.click(await screen.findByRole('button', { name: /Groceries/ }));

		expect(onpick).toHaveBeenCalledWith(groceries);
	});
});

describe('Link popup', () => {
	type Chain = Record<string, ReturnType<typeof vi.fn>>;

	function fakeEditor(): { editor: Editor; chain: Chain } {
		const chain: Chain = {};
		for (const step of ['focus', 'extendMarkRange', 'unsetLink', 'insertContent', 'run']) {
			chain[step] = vi.fn(() => chain);
		}
		return { editor: { chain: () => chain } as unknown as Editor, chain };
	}

	function renderPopup(href: string, text: string = 'link text'): Rendered & { chain: Chain } {
		const { editor, chain } = fakeEditor();
		const rendered = renderWithNotes(
			LinkBubbleMenu,
			{ editor, link: { href, text }, iconSize: 14, buttonClass: '' },
			(notes) => (notes.notes = [note({ id: UUID, title: 'Groceries' })])
		);
		return { ...rendered, chain };
	}

	it('labels an internal link with the note title and opens it in the app', async () => {
		const { notes } = renderPopup(`/notes/${UUID}`);
		const openNote = vi.spyOn(notes, 'openNote').mockResolvedValue();

		expect(screen.getByText('Groceries')).toBeInTheDocument();
		await fireEvent.click(screen.getByTitle(en.notes.link_open));

		expect(openNote).toHaveBeenCalledWith(UUID);
	});

	it('marks a link to a deleted note and still opens it', async () => {
		const missing = '00000000-0000-4000-8000-000000000000';
		const { notes } = renderPopup(`/notes/${missing}`, 'Old title');
		const openNote = vi.spyOn(notes, 'openNote').mockResolvedValue();

		expect(screen.getByText('Old title')).toHaveClass('italic');
		await fireEvent.click(screen.getByTitle(en.notes.link_open));

		expect(openNote).toHaveBeenCalledWith(missing);
	});

	it('labels an external link with its host and opens it in a new tab', () => {
		renderPopup('https://www.example.com/page');

		expect(screen.getByText('www.example.com')).toBeInTheDocument();
		const open = screen.getByTitle(en.notes.link_open);
		expect(open).toHaveAttribute('href', 'https://www.example.com/page');
		expect(open).toHaveAttribute('target', '_blank');
	});

	it('offers no open action for an unsafe link', () => {
		renderPopup('javascript:alert(1)');

		expect(screen.queryByTitle(en.notes.link_open)).toBeNull();
	});

	it('removes the whole link', async () => {
		const { chain } = renderPopup('https://www.example.com');

		await fireEvent.click(screen.getByTitle(en.notes.link_remove));

		expect(chain.extendMarkRange).toHaveBeenCalledWith('link');
		expect(chain.unsetLink).toHaveBeenCalled();
		expect(chain.run).toHaveBeenCalled();
	});

	it('edits the link in the link modal, prefilled', async () => {
		const { chain } = renderPopup('https://www.example.com', 'Example');

		await fireEvent.click(screen.getByTitle(en.notes.link_edit));

		expect(await screen.findByDisplayValue('https://www.example.com')).toBeInTheDocument();
		const name = screen.getByDisplayValue('Example');
		await userEvent.clear(name);
		await userEvent.type(name, 'Renamed');
		await fireEvent.click(screen.getByRole('button', { name: en.layout.modal_confirm }));

		expect(chain.extendMarkRange).toHaveBeenCalledWith('link');
		expect(chain.insertContent).toHaveBeenCalledWith({
			type: 'text',
			text: 'Renamed',
			marks: [{ type: 'link', attrs: { href: 'https://www.example.com' } }]
		});
	});
});

describe('Linked from', () => {
	it('lists the linking notes as links and selects one on click', async () => {
		const onselect = vi.fn();
		renderWithContext(NoteBacklinks, {
			backlinks: [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }],
			onselect
		});

		expect(screen.getByText(en.notes.linked_from)).toBeInTheDocument();
		const beta = screen.getByRole('link', { name: 'Beta' });
		expect(beta).toHaveAttribute('href', '/notes/b');

		beta.addEventListener('click', (event) => event.preventDefault());
		await fireEvent.click(beta);

		expect(onselect).toHaveBeenCalledWith('b');
	});
});
