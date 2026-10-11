import { setContext, getContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import PlannerService from '$lib/services/PlannerService';
import { getUrlFormat } from '$lib/helpers/DateHelper';
import { SvelteDate } from 'svelte/reactivity';
import type { PlannerEntry } from '$lib/types/planner';
import type { Todo } from '$lib/types/todo';
import type { CalendarEvent } from '$lib/types/calendar';
import type { CheckIn } from '$lib/types/check_in';

export class Planner {
	loaded = $state<boolean>(false);
	selectedDay = $state<Date>(new SvelteDate());
	// Back-navigation is free; the strip always starts from this day.
	stripStart = $state<Date>(new SvelteDate());
	entries = $state<PlannerEntry[]>([]);
	todos = $state<Todo[]>([]);
	events = $state<CalendarEvent[]>([]);
	checkIns = $state<CheckIn[]>([]);
	plannerService = new PlannerService();
	apiService: ApiService;

	// The 7-day strip rendered by the navigation, based on stripStart.
	days = $derived(this.plannerService.getStrip(this.stripStart));

	constructor() {
		this.apiService = getAuth().apiService;
	}

	selectDay(date: Date): void {
		this.selectedDay = new SvelteDate(date.getFullYear(), date.getMonth(), date.getDate());
	}

	nextStrip(): void {
		this.stripStart = new SvelteDate(
			this.stripStart.getFullYear(),
			this.stripStart.getMonth(),
			this.stripStart.getDate() + PlannerService.DAYS_IN_STRIP
		);
		void this.load();
	}

	lastStrip(): void {
		this.stripStart = new SvelteDate(
			this.stripStart.getFullYear(),
			this.stripStart.getMonth(),
			this.stripStart.getDate() - PlannerService.DAYS_IN_STRIP
		);
		void this.load();
	}

	goToToday(): void {
		const today = new SvelteDate();
		this.stripStart = today;
		this.selectDay(today);
		void this.load();
	}

	// Loads the whole strip in one parallel batch: planner entries, todos
	// (due within strip), check-ins, and read-only calendar events.
	async load(): Promise<void> {
		const from = this.plannerService.dateKey(this.stripStart);
		const to = this.plannerService.dateKey(
			this.plannerService.getStrip(this.stripStart)[PlannerService.DAYS_IN_STRIP - 1]
		);

		const [entriesRes, todosRes, checkInsRes, eventsRes] = await Promise.all([
			this.apiService.list(apiRoutes.planner.list(from, to)),
			this.apiService.list(apiRoutes.todos.listRange({ due_from: from, due_to: to })),
			this.apiService.list(apiRoutes.checkIn.listRange({ from, to })),
			this.apiService.list(apiRoutes.calendars.eventsRange(from, to))
		]);

		this.entries = (entriesRes?.data as PlannerEntry[]) ?? [];
		this.todos = (todosRes?.data as Todo[]) ?? [];
		this.checkIns = (checkInsRes?.data as CheckIn[]) ?? [];
		this.events =
			(eventsRes?.data as CalendarEvent[])?.map((item) => ({
				...item,
				start_date: new SvelteDate(item.start_date),
				end_date: new SvelteDate(item.end_date)
			})) ?? [];
		this.loaded = true;
	}

	getEntriesForDate(date: Date): PlannerEntry[] {
		return this.plannerService.getEntriesForDate(this.entries, date);
	}

	getTodosForDate(date: Date): Todo[] {
		return this.plannerService.getTodosForDate(this.todos, date);
	}

	getOverdueTodos(date: Date = new Date()): Todo[] {
		return this.plannerService.getOverdueTodos(this.todos, date);
	}

	getEventsForDate(date: Date): CalendarEvent[] {
		return this.plannerService.getEventsForDate(this.events, date);
	}

	getCheckInForDate(date: Date): CheckIn | null {
		const key = getUrlFormat(date);
		return this.checkIns.find((c) => c.date === key) ?? null;
	}

	async createEntry(request: {
		title: string;
		start_minutes: number;
		duration_minutes: number;
		is_all_day?: boolean;
		color?: string | null;
	}): Promise<boolean> {
		const res = await this.apiService.create(apiRoutes.planner.create, {
			date: getUrlFormat(this.selectedDay),
			...request
		});
		if (res) await this.load();
		return res !== null;
	}

	async updateEntry(
		id: number,
		request: {
			title?: string;
			start_minutes?: number;
			duration_minutes?: number;
			is_all_day?: boolean;
			color?: string | null;
		}
	): Promise<boolean> {
		const res = await this.apiService.update(apiRoutes.planner.update, id, request);
		if (res) await this.load();
		return res;
	}

	async deleteEntry(id: number): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.planner.delete, id);
		if (res) await this.load();
		return res;
	}
}

const PLANNER_KEY = Symbol('SOLYTO_PLANNER');

export function setPlanner(): Planner {
	return setContext(PLANNER_KEY, new Planner());
}

export function getPlanner(): Planner {
	return getContext<Planner>(PLANNER_KEY);
}
