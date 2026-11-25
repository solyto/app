import type { Calendar, ImportFileTarget, ImportSource, ImportState } from '$lib/types/calendar';

export type CalendarImportError =
	| 'invalid_file'
	| 'calendar_not_found'
	| 'calendar_forbidden'
	| 'already_running'
	| 'rate_limited'
	| 'generic';

export type CalendarImportView = 'start' | 'select' | 'progress' | 'finished' | 'failed';

export default class CalendarImportService {
	defaultCalendarName(fileName: string): string {
		return fileName.replace(/\.ics$/i, '');
	}

	targetCalendars(calendars: Calendar[]): Calendar[] {
		return calendars.filter((calendar) => !calendar.is_shared && !calendar.is_external);
	}

	fileRequest(file: File, target: ImportFileTarget): FormData {
		const body = new FormData();
		body.append('file', file);

		if (target.type === 'new') {
			body.append('name', target.name.trim());
			if (target.color !== null) body.append('color', target.color);
		} else {
			body.append('calendar_id', target.calendarId.toString());
		}

		return body;
	}

	errorFor(status: number, source: ImportSource): CalendarImportError {
		switch (status) {
			case 409:
				return 'already_running';
			case 429:
				return 'rate_limited';
		}

		if (source === 'caldav') return 'generic';

		switch (status) {
			case 413:
			case 422:
				return 'invalid_file';
			case 404:
				return 'calendar_not_found';
			case 403:
				return 'calendar_forbidden';
			default:
				return 'generic';
		}
	}

	view(state: ImportState | null): CalendarImportView {
		switch (state?.stage) {
			case 'select':
				return 'select';
			case 'started':
				return state?.source === 'file' ? 'progress' : 'start';
			case 'calendars':
			case 'events':
				return 'progress';
			case 'finished':
				return 'finished';
			case 'failed':
				return 'failed';
			default:
				return 'start';
		}
	}

	isRunning(state: ImportState | null): boolean {
		return this.view(state) === 'progress';
	}

	isStale(state: ImportState | null): boolean {
		return state?.stage === 'finished' || state?.stage === 'failed';
	}

	progress(state: ImportState): number {
		return state.events_count === 0 ? 0 : (state.events_done + state.events_skipped) / state.events_count;
	}

	progressMarker(state: ImportState | null): string {
		if (!state) return '';
		return [state.stage, state.calendars_done, state.events_done, state.events_skipped].join(':');
	}
}
