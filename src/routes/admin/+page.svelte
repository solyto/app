<script lang="ts">
	import { onMount } from 'svelte';
	import { getStatistics } from '$lib/state/Statistics.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import StatisticWidget from '$lib/components/admin/StatisticWidget.svelte';
	import IconCheckCheck from '$lib/icons/lucide/check-check.svelte';
	import IconNotebook from '$lib/icons/lucide/notebook.svelte';
	import IconMusic from '$lib/icons/lucide/eighth-notes.svelte';
	import IconBook from '$lib/icons/lucide/book.svelte';
	import IconClapperboard from '$lib/icons/lucide/clapperboard.svelte';
	import IconLink from '$lib/icons/lucide/link.svelte';
	import IconQuote from '$lib/icons/lucide/quote.svelte';
	import IconCookingPot from '$lib/icons/lucide/cooking-pot.svelte';
	import IconUser from '$lib/icons/lucide/user.svelte';
	import IconLayoutDashboard from '$lib/icons/lucide/layout-dashboard.svelte';
	import IconFolderOpen from '$lib/icons/lucide/folder-open.svelte';
	import IconLayoutGrid from '$lib/icons/lucide/layout-grid.svelte';
	import IconTag from '$lib/icons/lucide/tag.svelte';
	import IconClock from '$lib/icons/lucide/clock.svelte';
	import IconLayers from '$lib/icons/lucide/layers.svelte';
	import IconFolderKanban from '$lib/icons/lucide/folder-kanban.svelte';
	import IconCalendar from '$lib/icons/lucide/calendar.svelte';
	import IconCalendarDays from '$lib/icons/lucide/calendar-days.svelte';
	import IconBookUser from '$lib/icons/lucide/book-user.svelte';
	import IconUsers from '$lib/icons/lucide/users.svelte';
	import IconUserRoundCheck from '$lib/icons/lucide/user-round-check.svelte';
	import IconUserPlus from '$lib/icons/lucide/user-plus.svelte';
	import IconGamepad2 from '$lib/icons/lucide/gamepad-2.svelte';
	import IconRss from '$lib/icons/lucide/rss.svelte';
	import IconTrendingUp from '$lib/icons/lucide/trending-up.svelte';
	import IconLandmark from '$lib/icons/lucide/landmark.svelte';
	import IconMapPin from '$lib/icons/lucide/map-pin.svelte';
	import IconBell from '$lib/icons/lucide/bell.svelte';
	import IconFolderTree from '$lib/icons/lucide/folder-tree.svelte';

	const statistics = getStatistics();
	const loadingIndicator = getLoadingIndicator();

	let delayIndex = 0;
	const delay = () => delayIndex++ * 25;

	onMount(async () => {
		loadingIndicator.start();
		await statistics.load();
		loadingIndicator.stop();
	});
</script>

<div class="flex h-full w-full flex-col gap-8 overflow-auto p-8">
	<div class="flex items-center gap-3">
		<div class="rounded-lg bg-c-primary/10 p-2 dark:bg-c-primary/20">
			<IconLayoutDashboard class="h-6 w-6 text-c-primary" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-c-neutral-9 dark:text-white">Dashboard</h1>
			<p class="text-c-neutral-5 dark:text-c-neutral-4">Overview of platform statistics</p>
		</div>
	</div>

	{#if statistics.loaded}
		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Users</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Users" number={statistics.overview?.users ?? 0} icon={IconUser} color="blue" loadDelay={delay()} />
				<StatisticWidget label="Active Users" number={statistics.overview?.active_users ?? 0} icon={IconUserRoundCheck} color="blue" loadDelay={delay()} />
				<StatisticWidget label="Confirmed Users" number={statistics.overview?.confirmed_users ?? 0} icon={IconUsers} color="teal" loadDelay={delay()} />
				<StatisticWidget label="Friends" number={statistics.overview?.friends ?? 0} icon={IconUserPlus} color="purple" loadDelay={delay()} />
				<StatisticWidget label="Notifications" number={statistics.overview?.ui_notifications ?? 0} icon={IconBell} color="yellow" loadDelay={delay()} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Calendars</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Calendars" number={statistics.overview?.calendars ?? 0} icon={IconCalendar} color="teal" loadDelay={delay()} />
				<StatisticWidget label="Events" number={statistics.overview?.calendar_events ?? 0} icon={IconCalendarDays} color="green" loadDelay={delay()} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Todos</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Todos" number={statistics.overview?.todos ?? 0} icon={IconCheckCheck} color="green" loadDelay={delay()} />
				<StatisticWidget label="Categories" number={statistics.overview?.todo_categories ?? 0} icon={IconFolderOpen} color="teal" loadDelay={delay()} />
				<StatisticWidget label="Workspaces" number={statistics.overview?.todo_workspaces ?? 0} icon={IconLayoutGrid} color="blue" loadDelay={delay()} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Notes</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Notes" number={statistics.overview?.notes ?? 0} icon={IconNotebook} color="yellow" loadDelay={delay()} />
				<StatisticWidget label="Folders" number={statistics.overview?.note_folders ?? 0} icon={IconFolderTree} color="orange" loadDelay={delay()} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Libraries</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Books" number={statistics.overview?.books ?? 0} icon={IconBook} color="orange" loadDelay={delay()} />
				<StatisticWidget label="Albums" number={statistics.overview?.albums ?? 0} icon={IconMusic} color="purple" loadDelay={delay()} />
				<StatisticWidget label="Movies" number={statistics.overview?.movies ?? 0} icon={IconClapperboard} color="red" loadDelay={delay()} />
				<StatisticWidget label="Recipes" number={statistics.overview?.recipes ?? 0} icon={IconCookingPot} color="teal" loadDelay={delay()} />
				<StatisticWidget label="Links" number={statistics.overview?.links ?? 0} icon={IconLink} color="blue" loadDelay={delay()} />
				<StatisticWidget label="Quotes" number={statistics.overview?.quotes ?? 0} icon={IconQuote} color="yellow" loadDelay={delay()} />
				<StatisticWidget label="Games" number={statistics.overview?.library_games ?? 0} icon={IconGamepad2} color="green" loadDelay={delay()} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Contacts</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Address Books" number={statistics.overview?.address_books ?? 0} icon={IconBookUser} color="yellow" loadDelay={delay()} />
				<StatisticWidget label="Contacts" number={statistics.overview?.contacts ?? 0} icon={IconUsers} color="blue" loadDelay={delay()} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Check-in</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Entries" number={statistics.overview?.check_in_entries ?? 0} icon={IconMapPin} color="red" loadDelay={delay()} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Finances</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Income Entries" number={statistics.overview?.income_entries ?? 0} icon={IconTrendingUp} color="green" loadDelay={delay()} />
				<StatisticWidget label="Wealth Entries" number={statistics.overview?.wealth_entries ?? 0} icon={IconLandmark} color="teal" loadDelay={delay()} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Time Tracking</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Entries" number={statistics.overview?.time_tracking_entries ?? 0} icon={IconClock} color="orange" loadDelay={delay()} />
				<StatisticWidget label="Categories" number={statistics.overview?.time_tracking_categories ?? 0} icon={IconLayers} color="teal" loadDelay={delay()} />
				<StatisticWidget label="Projects" number={statistics.overview?.time_tracking_projects ?? 0} icon={IconFolderKanban} color="blue" loadDelay={delay()} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Feeds</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Subscribed Feeds" number={statistics.overview?.feed_subscriptions ?? 0} icon={IconRss} color="orange" loadDelay={delay()} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-c-neutral-4 dark:text-c-neutral-5">Other</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatisticWidget label="Tags" number={statistics.overview?.tags ?? 0} icon={IconTag} color="purple" loadDelay={delay()} />
			</div>
		</section>
	{/if}
</div>
