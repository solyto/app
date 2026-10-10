import { describe, it, expect } from 'vitest';
import JournalService from '$lib/services/JournalService';
import type { Note, NoteCategory } from '$lib/types/note';

function category(id: number, overrides: Partial<NoteCategory> = {}): NoteCategory {
	return {
		id,
		title: 'Category',
		parent_id: null,
		sort_order: 0,
		is_system: false,
		is_hidden: false,
		created_at: '',
		updated_at: '',
		children: [],
		...overrides
	};
}

function note(overrides: Partial<Note> = {}): Note {
	return {
		id: 'n1',
		title: 'Note',
		content: '',
		category_id: null,
		tags: [],
		is_favorite: false,
		created_at: '',
		updated_at: '',
		...overrides
	};
}

const service = new JournalService();

describe('findJournalCategory', () => {
	it('finds a root-level system category', () => {
		const journal = category(3, { title: '.journal', is_system: true, is_hidden: true });
		expect(service.findJournalCategory([category(1), journal, category(2)])).toBe(journal);
	});

	it('finds a system category nested as a child', () => {
		const journal = category(9, { is_system: true });
		const parent = category(1, { children: [category(2), journal] });
		expect(service.findJournalCategory([parent])).toBe(journal);
	});

	it('returns null when no category is a system folder', () => {
		expect(service.findJournalCategory([category(1), category(2)])).toBeNull();
	});

	it('returns null for an empty list', () => {
		expect(service.findJournalCategory([])).toBeNull();
	});
});

describe('getEntryTitle', () => {
	it('formats a date as YYYY-MM-DD', () => {
		expect(service.getEntryTitle(new Date(2026, 7, 4))).toBe('2026-08-04');
	});

	it('pads single-digit months and days', () => {
		expect(service.getEntryTitle(new Date(2026, 0, 9))).toBe('2026-01-09');
	});
});

describe('isEntryTitle', () => {
	it('accepts date titles', () => {
		expect(service.isEntryTitle('2026-08-04')).toBe(true);
	});

	it('rejects non-date titles', () => {
		expect(service.isEntryTitle('My day')).toBe(false);
		expect(service.isEntryTitle('2026-8-4')).toBe(false);
		expect(service.isEntryTitle('')).toBe(false);
	});
});

describe('findEntry', () => {
	it('finds the entry in the journal folder for the date', () => {
		const notes = [
			note({ id: 'a', title: '2026-08-04', category_id: 7 }),
			note({ id: 'b', title: '2026-08-03', category_id: 7 })
		];
		expect(service.findEntry(notes, 7, new Date(2026, 7, 4))?.id).toBe('a');
	});

	it('ignores a matching title in an ordinary folder', () => {
		const notes = [note({ id: 'a', title: '2026-08-04', category_id: 2 })];
		expect(service.findEntry(notes, 7, new Date(2026, 7, 4))).toBeNull();
	});

	it('returns null when no entry exists for the day', () => {
		expect(service.findEntry([], 7, new Date(2026, 7, 4))).toBeNull();
	});
});

describe('getEntryDates', () => {
	it('returns the date titles of entries in the journal folder', () => {
		const notes = [
			note({ id: 'a', title: '2026-08-04', category_id: 7 }),
			note({ id: 'b', title: '2026-08-02', category_id: 7 }),
			note({ id: 'c', title: 'Not a date', category_id: 7 }),
			note({ id: 'd', title: '2026-08-01', category_id: 2 })
		];
		expect(service.getEntryDates(notes, 7)).toEqual(['2026-08-04', '2026-08-02']);
	});

	it('returns an empty list when the folder has no entries', () => {
		expect(service.getEntryDates([], 7)).toEqual([]);
	});
});

describe('isReachable', () => {
	const today = new Date(2026, 7, 4);

	it('allows today', () => {
		expect(service.isReachable(new Date(2026, 7, 4), today)).toBe(true);
	});

	it('allows earlier days', () => {
		expect(service.isReachable(new Date(2026, 7, 1), today)).toBe(true);
	});

	it('rejects future days', () => {
		expect(service.isReachable(new Date(2026, 7, 5), today)).toBe(false);
	});

	it('compares by day, ignoring the time of day', () => {
		const lateToday = new Date(2026, 7, 4, 23, 59);
		expect(service.isReachable(lateToday, new Date(2026, 7, 4, 0, 1))).toBe(true);
	});
});
