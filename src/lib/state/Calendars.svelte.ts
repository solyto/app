import type {
	Calendar,
	Event,
	CalendarWeek,
	CalendarMonth,
	UpdateCalendarRequest,
	CreateEventRequest,
	UpdateEventRequest,
	CreateCalendarRequest,
	ImportRequest,
	SelectImportCalendarsRequest,
	ImportState,
	ShareCalendarRequest
} from '$lib/types/calendar';
import { getContext, setContext, tick } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import { browser } from '$app/environment';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import { SvelteDate } from 'svelte/reactivity';
import {
	formatDate,
	getCalendarMonth,
	getCalendarWeek,
	getDateDiffInMinutes,
	getWeekNumber
} from '$lib/helpers/DateHelper';
import type { Todo, UpdateTodoRequest } from '$lib/types/todo';

export class Calendars {
	calendars = $state<Calendar[]>([]);
	events = $state<Event[]>([]);
	sortedEvents = $state<Record<string, Event[]>>({});
	todos = $state<Todo[]>([]);
	month = $state<CalendarMonth>({ weeks: [] });
	currentWeek = $state<number>(0);
	currentMonth = $state<number>(0);
	currentYear = $state<number>(0);
	currentDate = $state<SvelteDate>(new SvelteDate());
	auth = getAuth();
	loaded = $state<boolean>(false);
	editSidebar = $state<boolean>(false);
	selectedDate = $state<SvelteDate | null>(null);
	isSyncing = $state<boolean>(false);
	lastSync = $state<number | null>(null);
	view = $state<'month' | 'week' | 'day' | 'list'>('month');
	activeEvent = $state<Event | null>(null);
	selectedCalendar = $state<Calendar | null>(null);
	deletionModal = $state<boolean>(false);
	importModal = $state<boolean>(false);
	syncModal = $state<boolean>(false);
	hiddenCalendars = $state<number[]>([]);
	mobileSelectedDate = $state<SvelteDate>(new SvelteDate());
	mobileWeekStart = $state<SvelteDate>(new SvelteDate());
	shareModal = $state<boolean>(false);
	shareCalendarTarget = $state<Calendar | null>(null);
	apiService: ApiService;

	pendingInvites = $derived(this.calendars.filter((c) => c.invite_status === 'pending'));
	ownedCalendars = $derived(this.calendars.filter((c) => c.invite_status === null));
	acceptedSharedCalendars = $derived(
		this.calendars.filter((c) => c.invite_status === 'accepted')
	);

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());

		const today = new SvelteDate();
		this.currentWeek = getWeekNumber(today);
		this.currentMonth = today.getMonth() + 1;
		this.currentYear = today.getFullYear();

		this.loadView();
		this.loadMonth();
	}

	async loadCalendars(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.calendars.listCalendars);
		if (res) this.calendars = res.data as Calendar[];
		this.loaded = true;
	}

	loadMonth(): void {
		const calendarDays = getCalendarMonth(this.currentYear, this.currentMonth - 1);

		const weeks: CalendarWeek[] = [];
		for (let i = 0; i < calendarDays.length; i += 7) {
			const firstDayOfWeek = calendarDays[i];
			weeks.push({
				number: firstDayOfWeek.date ? getWeekNumber(firstDayOfWeek.date) : 0,
				days: calendarDays.slice(i, i + 7)
			});
		}

		this.month = { weeks };
	}

	async loadEvents(month: string | null = null, year: string | null = null): Promise<void> {
		const res = await this.apiService.list(
			apiRoutes.calendars.listEvents.replace(
				'%s',
				this.currentYear.toString() + '-' + this.currentMonth.toString().padStart(2, '0')
			)
		);
		if (res) {
			const newEvents: Event[] = [];
			const newSortedEvents: Record<string, Event[]> = {};

			for (const item of res.data as Event[]) {
				const start_date = item.start_date ? new SvelteDate(item.start_date) : null;
				const end_date = item.end_date ? new SvelteDate(item.end_date) : null;
				const recurrence_end = item.recurrence_end
					? new SvelteDate(item.recurrence_end)
					: null;
				const original_start_date = item.original_start_date
					? new SvelteDate(item.original_start_date)
					: null;

				const itemWithDates = {
					...item,
					start_date,
					end_date,
					recurrence_end,
					original_start_date
				};

				newEvents.push(<Event>itemWithDates);

				if (start_date !== null) {
					const dateSlug = formatDate(start_date);

					if (!newSortedEvents[dateSlug]) {
						newSortedEvents[dateSlug] = [];
					}

					newSortedEvents[dateSlug].push(<Event>itemWithDates);

					if (
						item.is_all_day &&
						end_date !== null &&
						getDateDiffInMinutes(start_date, end_date) > 1440
					) {
						let currentDate = new SvelteDate(start_date);
						while (currentDate < end_date) {
							currentDate = new SvelteDate(
								currentDate.setDate(currentDate.getDate() + 1)
							);
							const dateSlug = formatDate(currentDate);
							if (!newSortedEvents[dateSlug]) {
								newSortedEvents[dateSlug] = [];
							}
							newSortedEvents[dateSlug].push(<Event>itemWithDates);
						}
					}
				}
			}

			this.events = newEvents;
			this.sortedEvents = newSortedEvents;
		}
	}

	async getWidgetEvents(): Promise<Event[]> {
		const res = await this.apiService.list(apiRoutes.calendars.listWidgetEvents);
		if (res) return res.data as Event[];
		return [];
	}

	async loadTodos(): Promise<void> {
		const res = await this.apiService.list(apiRoutes.todos.list);
		if (res) this.todos = res.data as Todo[];
	}

	changeView(view: 'month' | 'week' | 'day' | 'list'): void {
		this.view = view;
		this.saveView();
	}

	loadView(): void {
		if (!browser) return;

		const stored = localStorage.getItem('calendars_view');
		if (stored) {
			this.view = JSON.parse(stored);
		}
	}

	saveView(): void {
		if (!browser) return;

		localStorage.setItem('calendars_view', JSON.stringify(this.view));
	}

	async nextMonth(): Promise<void> {
		if (this.currentMonth === 12) {
			this.currentMonth = 1;
			this.currentYear++;
		} else {
			this.currentMonth++;
		}
		this.loadMonth();
		await this.loadEvents();
	}

	async lastMonth(): Promise<void> {
		if (this.currentMonth === 1) {
			this.currentMonth = 12;
			this.currentYear--;
		} else {
			this.currentMonth--;
		}
		this.loadMonth();
		await this.loadEvents();
	}

	nextWeek(): void {
		if (this.currentWeek === 53) {
			this.currentWeek = 1;
			this.currentMonth++;
			this.currentYear++;
		}

		this.currentWeek++;
		const weekDays = getCalendarWeek(this.currentYear, this.currentWeek);
		this.mobileWeekStart = new SvelteDate(weekDays[0].date);
	}

	lastWeek(): void {
		if (this.currentWeek === 1) {
			this.currentWeek = 53;
			this.currentMonth--;
			this.currentYear--;
		}

		this.currentWeek--;
		const weekDays = getCalendarWeek(this.currentYear, this.currentWeek);
		this.mobileWeekStart = new SvelteDate(weekDays[0].date);
	}

	nextDay(): void {
		this.currentDate = new SvelteDate(this.currentDate.setDate(this.currentDate.getDate() + 1));
	}

	lastDay(): void {
		this.currentDate = new SvelteDate(this.currentDate.setDate(this.currentDate.getDate() - 1));
	}

	selectMobileDate(date: Date): void {
		this.mobileSelectedDate = new SvelteDate(date);
	}

	setMobileWeekStart(date: Date): void {
		this.mobileWeekStart = new SvelteDate(date);
		this.currentWeek = getWeekNumber(date);
	}

	async goToToday(): Promise<void> {
		const today = new SvelteDate();
		this.currentDate = today;
		this.currentWeek = getWeekNumber(today);
		this.currentMonth = today.getMonth() + 1;
		this.currentYear = today.getFullYear();
		this.mobileSelectedDate = new SvelteDate(today);
		this.mobileWeekStart = new SvelteDate(today);
		this.loadMonth();
		await this.loadEvents();
	}

	getEventsForDate(date: Date): Event[] {
		const dateSlug = formatDate(date);

		if (!this.sortedEvents[dateSlug]) {
			return [];
		}

		return this.sortedEvents[dateSlug] ?? [];
	}

	getAllDayEventsForDate(date: Date): Event[] {
		const dateSlug = formatDate(date);

		if (!this.sortedEvents[dateSlug]) {
			return [];
		}

		return this.sortedEvents[dateSlug]?.filter((e) => e.is_all_day) ?? [];
	}

	getNonAllDayEventsForDate(date: Date): Event[] {
		const dateSlug = formatDate(date);

		if (!this.sortedEvents[dateSlug]) {
			return [];
		}

		return (
			this.sortedEvents[dateSlug]
				?.filter((e) => !e.is_all_day)
				?.sort((a, b) => a.start_date.getTime() - b.start_date.getTime()) ?? []
		);
	}

	getTodosForDate(date: Date): Todo[] {
		return this.todos.filter((t) => {
			const due_date = new SvelteDate(t.due_at);

			return (
				due_date.getFullYear() === date.getFullYear() &&
				due_date.getMonth() === date.getMonth() &&
				due_date.getDate() === date.getDate()
			);
		});
	}

	toggleCalendar(id: number): void {
		const index = this.hiddenCalendars.indexOf(id);

		if (index === -1) {
			this.hiddenCalendars.push(id);
		} else {
			this.hiddenCalendars.splice(index, 1);
		}
	}

	isCalendarHidden(id: number): boolean {
		return this.hiddenCalendars.indexOf(id) !== -1;
	}

	async showSidebar(
		selectedDate: Date | null = null,
		selectedEntry: Event | null = null
	): Promise<void> {
		this.hideSidebar();
		await tick();
		this.selectedDate = new SvelteDate(selectedDate);
		this.activeEvent = selectedEntry;
		this.editSidebar = true;
	}

	hideSidebar(): void {
		this.editSidebar = false;
		this.selectedDate = null;
	}

	async createEvent(request: CreateEventRequest): Promise<boolean> {
		const res = await this.apiService.create(
			apiRoutes.calendars.createEvent.replace('%d', request.calendar_id.toString()),
			request
		);
		if (res) await this.loadEvents();
		return res !== null;
	}

	async updateEvent(entry: Event, request: UpdateEventRequest): Promise<boolean> {
		const res = await this.apiService.update(
			apiRoutes.calendars.updateEvent.replace('%d', entry.calendar_id.toString()),
			entry.uri,
			request
		);
		if (res) await this.loadEvents();
		return res;
	}

	async deleteEvent(entry: Event): Promise<boolean> {
		const res = await this.apiService.delete(
			apiRoutes.calendars.deleteEvent.replace('%d', entry.calendar_id.toString()),
			entry.uri
		);
		if (res) await this.loadEvents();
		return res;
	}

	async updateOccurrence(
		entry: Event,
		request: UpdateEventRequest,
		occurrenceDate: Date
	): Promise<boolean> {
		const occDateStr = occurrenceDate.toISOString();
		const url = apiRoutes.calendars.updateOccurrence
			.replace('%d', entry.calendar_id.toString())
			.replace('%s', entry.uri)
			.replace('%s', encodeURIComponent(occDateStr));
		const res = await this.apiService.put(url, request);
		if (res) await this.loadEvents();
		return res;
	}

	async deleteOccurrence(entry: Event, occurrenceDate: Date): Promise<boolean> {
		const occDateStr = occurrenceDate.toISOString();
		const url = apiRoutes.calendars.deleteOccurrence
			.replace('%d', entry.calendar_id.toString())
			.replace('%s', entry.uri)
			.replace('%s', encodeURIComponent(occDateStr));
		const res = await fetch(url, {
			method: 'DELETE',
			headers: { Authorization: 'Bearer ' + this.auth.getToken(), Accept: 'application/json' }
		});
		if (res.ok) await this.loadEvents();
		return res.ok;
	}

	async createCalendar(request: CreateCalendarRequest): Promise<boolean> {
		const res = await this.apiService.post(apiRoutes.calendars.createCalendar, request);
		if (res) await this.loadCalendars();
		return res !== null;
	}

	async updateCalendar(calendar: Calendar, request: UpdateCalendarRequest): Promise<boolean> {
		const res = await this.apiService.update(
			apiRoutes.calendars.updateCalendar,
			calendar.id,
			request
		);
		if (res) {
			await this.loadCalendars();
			await this.loadEvents();
		}
		return res !== null;
	}

	async deleteCalendar(calendar: Calendar): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.calendars.deleteCalendar, calendar.id);
		if (res) {
			await this.loadCalendars();
			await this.loadEvents();
		}
		this.selectedCalendar = null;
		this.deletionModal = false;
		return res !== null;
	}

	async startImport(request: ImportRequest): Promise<boolean> {
		return (await this.apiService.post(apiRoutes.calendars.startImport, request)) !== null;
	}

	async selectImportCalendars(request: SelectImportCalendarsRequest) {
		return (
			(await this.apiService.post(apiRoutes.calendars.selectImportCalendars, request)) !==
			null
		);
	}

	async getImportState(): Promise<ImportState | null> {
		const res = await this.apiService.get(apiRoutes.calendars.getImportState, '');
		if (res) return res.data as ImportState;
		return null;
	}

	async changeTodoCompleted(todo: Todo, checked: boolean): Promise<boolean> {
		const request: UpdateTodoRequest = { is_completed: checked };
		const res = await this.apiService.update(apiRoutes.todos.update, todo.id, request);
		if (res) await this.loadTodos();
		return res;
	}

	async shareCalendar(calendarId: number, friendId: string): Promise<boolean> {
		const request: ShareCalendarRequest = { friend_id: friendId };
		const res = await this.apiService.post(
			apiRoutes.calendars.shareCalendar.replace('%d', calendarId.toString()),
			request
		);
		return res !== null;
	}

	async revokeShare(calendarId: number, userId: string): Promise<boolean> {
		const url = apiRoutes.calendars.revokeShare
			.replace('%d', calendarId.toString())
			.replace('%s', userId);
		const res = await fetch(url, {
			method: 'DELETE',
			headers: { Authorization: 'Bearer ' + this.auth.getToken(), Accept: 'application/json' }
		});
		return res.ok;
	}

	async unsubscribeFromCalendar(calendarId: number): Promise<boolean> {
		const url = apiRoutes.calendars.unsubscribe.replace('%d', calendarId.toString());
		const res = await fetch(url, {
			method: 'DELETE',
			headers: { Authorization: 'Bearer ' + this.auth.getToken(), Accept: 'application/json' }
		});
		if (res.ok) await this.loadCalendars();
		return res.ok;
	}

	async acceptInvite(token: string): Promise<boolean> {
		const res = await this.apiService.put(
			apiRoutes.calendars.acceptInvite.replace('%s', token),
			{}
		);
		if (res) await this.loadCalendars();
		return res;
	}

	async declineInvite(token: string): Promise<boolean> {
		const res = await this.apiService.put(
			apiRoutes.calendars.declineInvite.replace('%s', token),
			{}
		);
		if (res) await this.loadCalendars();
		return res;
	}

	openShareModal(calendar: Calendar): void {
		this.shareCalendarTarget = calendar;
		this.shareModal = true;
	}

	closeShareModal(): void {
		this.shareModal = false;
		this.shareCalendarTarget = null;
	}
}

const CALENDARS_KEY = Symbol('SOLYTO_CALENDARS');

export function setCalendars(): Calendars {
	return setContext(CALENDARS_KEY, new Calendars());
}

export function getCalendars(): Calendars {
	return getContext<Calendars>(CALENDARS_KEY);
}
