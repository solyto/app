<script lang="ts">
	import type { Todo } from '$lib/types/todo';
	import type { Event } from '$lib/types/calendar';
	import { blur } from 'svelte/transition';
	import { SvelteDate } from 'svelte/reactivity';
	import { onMount, onDestroy } from 'svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getWeather } from '$lib/state/Weather.svelte';
	import { getTodos } from '$lib/state/Todos.svelte';
	import { getCalendars } from '$lib/state/Calendars.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { formatTime } from '$lib/helpers/DateHelper';
	import { withDecimals } from '$lib/helpers/NumberHelper';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import TodoFilterService from '$lib/services/TodoFilterService';
	import TodoRelevanceService from '$lib/services/TodoRelevanceService';
	import TodoSortingService from '$lib/services/TodoSortingService';
	import Checkbox from '$lib/components/forms/Checkbox.svelte';
	import WeatherCodeImage from '$lib/components/weather/WeatherCodeImage.svelte';
	import ManageWeatherCity from '$lib/components/weather/ManageWeatherCity.svelte';
	import confetti from 'canvas-confetti';
	import { createConfettiOptions } from '$lib/effects/confetti';
	import IconMapPin from '@lucide/svelte/icons/map-pin';
	import IconCalendarDays from '@lucide/svelte/icons/calendar-days';
	import IconListTodo from '@lucide/svelte/icons/list-todo';
	import IconTrendingUp from '@lucide/svelte/icons/trending-up';
	import IconPen from '@lucide/svelte/icons/pen';

	const auth = getAuth();
	const weather = getWeather();
	const todos = getTodos();
	const calendars = getCalendars();
	const loadingIndicator = getLoadingIndicator();
	const ts = getTranslation();
	const filterService = new TodoFilterService();
	const relevanceService = new TodoRelevanceService();
	const sortingService = new TodoSortingService();

	const today = new Date();
	let date = new SvelteDate();
	let time = new SvelteDate();
	let forecast = $derived(weather.forecast);
	let temperatureUnit = $derived(auth?.user.settings.temperature_unit);

	let greeting = $derived.by(() => {
		const hour = time.getHours();
		if (hour < 12) return ts.get.home.greeting_morning;
		if (hour < 18) return ts.get.home.greeting_afternoon;
		return ts.get.home.greeting_evening;
	});

	let allEvents = $state<Event[]>([]);
	let todayEvents = $derived(
		allEvents
			.filter((e) => {
				const d = new Date(e.start_date);
				return (
					d.getDate() === today.getDate() &&
					d.getMonth() === today.getMonth() &&
					d.getFullYear() === today.getFullYear()
				);
			})
			.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
	);
	let upcomingEvents = $derived(
		allEvents
			.filter((e) => {
				const d = new Date(e.start_date);
				return (
					d.getDate() !== today.getDate() ||
					d.getMonth() !== today.getMonth() ||
					d.getFullYear() !== today.getFullYear()
				);
			})
			.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
	);
	let dueTodos = $derived(filterService.filterByDueDate('today-overdue', todos.filteredTodos));
	let scoredTodos = $state<Todo[]>([]);
	let manageWeatherModalOpen = $state<boolean>(false);

	$effect(() => {
		const cloned = todos.filteredTodos.map((t) => ({ ...t }));
		const scored = sortingService.sortByScore(relevanceService.getScoredTodos(cloned));
		scoredTodos = scored
			.filter(
				(t) =>
					t.relevance !== null &&
					t.relevance !== undefined &&
					t.relevance > 0.6 &&
					!dueTodos.some((d) => d.id === t.id)
			)
			.slice(0, 5);
	});

	let clockInterval: ReturnType<typeof setInterval>;

	onMount(() => {
		clockInterval = setInterval(() => {
			time.setTime(Date.now());
		}, 1000);

		weather.load();

		calendars.getWidgetEvents().then((events) => {
			if (events) allEvents = events;
		});
	});

	onDestroy(() => {
		clearInterval(clockInterval);
	});

	async function toggleTemperatureUnit(unit: 'c' | 'f'): Promise<void> {
		if (unit === temperatureUnit) return;
		auth.user.settings.temperature_unit = unit;
		await weather.updateTemperatureUnit(unit);
	}

	async function handleCheck(event: MouseEvent, todo: Todo): Promise<void> {
		loadingIndicator.start();
		const checkbox = event.target as HTMLInputElement;

		if (checkbox.checked) {
			const rect = checkbox.getBoundingClientRect();
			const x = (rect.left + rect.right) / 2 / window.innerWidth;
			const y = (rect.top + rect.bottom) / 2 / window.innerHeight;
			confetti(createConfettiOptions({ x, y }, 'default'));
		}

		await todos.changeCompleted(todo, checkbox.checked);
		todo.is_completed = checkbox.checked;
		loadingIndicator.stop();
	}

	function toggleWeatherModal(): void {
		manageWeatherModalOpen = !manageWeatherModalOpen;
	}
</script>

<div class="flex flex-col gap-12">
	<div class="group relative">
		<button
			class="absolute top-[-14px] right-[-14px] z-10 cursor-pointer rounded-full border-1 border-d-lightblue bg-c-bg-surface p-2 text-c-neutral-3 opacity-0 shadow-xs transition-opacity group-hover:opacity-100 hover:text-c-neutral-5 dark:border-s-dark-2"
			onclick={toggleWeatherModal}
		>
			<IconPen size="18" />
		</button>
		<div class="flex flex-col">
			<div class="mb-2 ml-1 text-sm text-c-neutral-5 dark:text-c-neutral-4">
				{greeting}, {auth.user?.name?.split(' ')[0]}
			</div>
			<div
				class="text-5xl tracking-wide text-c-heading transition-all duration-300 ease-in-out dark:text-c-primary"
			>
				{auth.getTimeInUserPreferredFormat(time)}
			</div>
			<div class="mt-2 ml-1 text-lg text-c-heading dark:text-c-primary">
				{auth.getDateWithWeekdayInUserPreferredFormat(date)}
			</div>
			{#if weather.loaded && weather.configured && forecast}
				<div class="mt-4 ml-1 flex items-center gap-3">
					<div class="flex items-center gap-2">
						<IconMapPin class="size-3 text-c-neutral-4 dark:text-c-neutral-5" />
						<span class="text-xs text-c-neutral-5 dark:text-c-neutral-4">{weather.city}</span>
					</div>
					<div class="h-3 w-px bg-c-neutral-2 dark:bg-s-dark-3"></div>
					<div class="flex items-center gap-2.5">
						<div class="flex h-8 w-8 items-center justify-center">
							<WeatherCodeImage code={forecast.today.code} />
						</div>
						<span class="text-lg font-semibold text-c-neutral-8 dark:text-white">
							{auth.getTemperatureInUserPreferredFormat(forecast.current.temperature)}°
						</span>
						<span class="whitespace-nowrap text-xs text-c-neutral-4 dark:text-c-neutral-5">
							{auth.getTemperatureInUserPreferredFormat(forecast.today.temperature_min)}° / {auth.getTemperatureInUserPreferredFormat(forecast.today.temperature_max)}°
						</span>
					</div>
					<button
						class="ml-auto shrink-0 cursor-pointer rounded-md bg-c-neutral-1 px-2 py-1 text-xs font-medium text-c-neutral-5 transition-colors hover:bg-c-neutral-2 hover:text-c-neutral-7 dark:bg-s-dark-3 dark:text-c-neutral-4 dark:hover:bg-s-dark-2 dark:hover:text-c-neutral-2"
						onclick={() => toggleTemperatureUnit(temperatureUnit === 'c' ? 'f' : 'c')}
					>{temperatureUnit.toUpperCase()}°</button>
				</div>
			{:else if weather.loaded}
				<button
					class="mt-4 ml-1 flex w-fit cursor-pointer items-center gap-1 text-xs text-c-primary transition-colors hover:text-c-primary/80"
					onclick={toggleWeatherModal}
				>
					<IconMapPin class="size-3" />
					<span>{ts.get.widgets.select_city_prompt}</span>
				</button>
			{/if}
		</div>
	</div>

	{#if todos.loaded}
		<div in:blur>
			{#if todayEvents.length > 0}
				<div>
					<div class="mb-2 flex items-center gap-2">
						<IconCalendarDays size={15} class="text-c-heading dark:text-c-primary" />
						<span
							class="text-xs font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary"
						>
							{ts.get.home.events}
						</span>
					</div>
					<div class="flex flex-col gap-1.5 pl-[3px]">
						{#each todayEvents as event (event.id)}
							<div class="flex items-center gap-2.5 py-0.5">
								<div
									class="h-3.5 w-[3px] shrink-0 rounded-full"
									style="background-color: {event.calendar_color}"
								></div>
								<span class="truncate text-sm text-c-neutral-7 dark:text-c-neutral-3">
									{event.title}
								</span>
								{#if !event.is_all_day}
									<span
										class="ml-auto shrink-0 text-xs text-c-neutral-4 dark:text-c-neutral-5"
									>
										{formatTime(new Date(event.start_date))}
									</span>
								{:else}
									<span
										class="ml-auto shrink-0 text-xs text-c-neutral-4 dark:text-c-neutral-5"
									>
										{ts.get.home.all_day}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if dueTodos.length > 0}
				<div class:mt-12={todayEvents.length > 0}>
					<div class="mb-2 flex items-center gap-2">
						<IconListTodo size={15} class="text-c-heading dark:text-c-primary" />
						<span
							class="text-xs font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary"
						>
							{ts.get.home.due_today}
						</span>
					</div>
					<div class="flex flex-col gap-1 pl-[1px]">
						{#each dueTodos as todo (todo.id)}
							<div class="flex items-center gap-2 py-0.5">
								<div
									class="h-2 w-2 shrink-0 rounded-full"
									class:bg-c-btn={todo.priority === 'medium' ||
										todo.priority === null}
									class:bg-c-danger={todo.priority === 'high'}
									class:bg-c-success={todo.priority === 'low'}
								></div>
								<span
									class="truncate text-sm text-c-neutral-7 dark:text-c-neutral-3"
									class:line-through={todo.is_completed}
									class:opacity-50={todo.is_completed}
								>
									{todo.title}
								</span>
								<Checkbox
									isChecked={todo.is_completed}
									onchange={(e) => handleCheck(e, todo)}
									class="ml-auto"
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if scoredTodos.length > 0}
				<div class:mt-12={todayEvents.length > 0 || dueTodos.length > 0}>
					<div class="mb-2 flex items-center gap-2">
						<IconTrendingUp size={15} class="text-c-heading dark:text-c-primary" />
						<span
							class="text-xs font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary"
						>
							{ts.get.home.relevant}
						</span>
					</div>
					<div class="flex flex-col gap-1 pl-[1px]">
						{#each scoredTodos as todo (todo.id)}
							<div class="flex items-center gap-2 py-0.5">
								<div
									class="h-2 w-2 shrink-0 rounded-full"
									class:bg-c-btn={todo.priority === 'medium' ||
										todo.priority === null}
									class:bg-c-danger={todo.priority === 'high'}
									class:bg-c-success={todo.priority === 'low'}
								></div>
								<span
									class="truncate text-sm text-c-neutral-7 dark:text-c-neutral-3"
									class:line-through={todo.is_completed}
									class:opacity-50={todo.is_completed}
								>
									{todo.title}
								</span>
								<span class="text-xs text-c-neutral-4 dark:text-c-neutral-5">
									{withDecimals(todo.relevance, 2)}
								</span>
								<Checkbox
									isChecked={todo.is_completed}
									onchange={(e) => handleCheck(e, todo)}
									class="ml-auto"
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if upcomingEvents.length > 0}
				<div
					class:mt-12={todayEvents.length > 0 ||
						dueTodos.length > 0 ||
						scoredTodos.length > 0}
				>
					<div class="mb-2 flex items-center gap-2">
						<IconCalendarDays size={15} class="text-c-heading dark:text-c-primary" />
						<span
							class="text-xs font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary"
						>
							{ts.get.widgets.coming_up}
						</span>
					</div>
					<div class="flex flex-col gap-1.5 pl-[3px]">
						{#each upcomingEvents as event (event.id)}
							<div class="flex items-center gap-2.5 py-0.5">
								<div
									class="h-3.5 w-[3px] shrink-0 rounded-full"
									style="background-color: {event.calendar_color}"
								></div>
								<span class="shrink-0 text-xs text-c-neutral-4 dark:text-c-neutral-5">
									{auth.getDateWithoutYearInUserPreferredFormat(
										new Date(event.start_date)
									)}
								</span>
								<span class="truncate text-sm text-c-neutral-7 dark:text-c-neutral-3">
									{event.title}
								</span>
								{#if !event.is_all_day}
									<span
										class="ml-auto shrink-0 text-xs text-c-neutral-4 dark:text-c-neutral-5"
									>
										{formatTime(new Date(event.start_date))}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if todayEvents.length === 0 && dueTodos.length === 0 && scoredTodos.length === 0 && upcomingEvents.length === 0}
				<p class="text-sm text-c-neutral-4 dark:text-c-neutral-5">{ts.get.home.nothing_today}</p>
			{/if}
		</div>
	{/if}
</div>
{#if manageWeatherModalOpen}
	<ManageWeatherCity onClose={toggleWeatherModal} />
{/if}
