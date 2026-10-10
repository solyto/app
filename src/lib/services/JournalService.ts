import type { Note, NoteCategory } from '$lib/types/note';
import { getUrlFormat } from '$lib/helpers/DateHelper';

// Journal entries are ordinary notes addressed by a date title (YYYY-MM-DD)
// inside the single system-owned journal folder.
const ENTRY_TITLE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default class JournalService {
	// The journal folder is identified by its system flag, never its title, so a
	// rename cannot break the interface. It is provisioned at the root level,
	// but children are checked too so the lookup stays correct if that changes.
	findJournalCategory(categories: NoteCategory[]): NoteCategory | null {
		for (const category of categories) {
			if (category.is_system) return category;
			if (category.children) {
				const child = category.children.find((c) => c.is_system);
				if (child) return child;
			}
		}

		return null;
	}

	getEntryTitle(date: Date): string {
		return getUrlFormat(date);
	}

	isEntryTitle(title: string): boolean {
		return ENTRY_TITLE_PATTERN.test(title);
	}

	findEntry(notes: Note[], categoryId: number, date: Date): Note | null {
		const title = this.getEntryTitle(date);
		return (
			notes.find((note) => note.category_id === categoryId && note.title === title) ?? null
		);
	}

	// Dates (YYYY-MM-DD) that already have an entry, for archive marking.
	getEntryDates(notes: Note[], categoryId: number): string[] {
		return notes
			.filter((note) => note.category_id === categoryId && this.isEntryTitle(note.title))
			.map((note) => note.title);
	}

	// Only today and earlier are reachable from the notebook; future days are not.
	isReachable(date: Date, today: Date = new Date()): boolean {
		return getUrlFormat(date) <= getUrlFormat(today);
	}
}
