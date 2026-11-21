<script lang="ts">
	import { blur } from 'svelte/transition';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import IconLayoutGrid from '$lib/icons/lucide/layout-grid.svelte';
	import IconCalendar from '$lib/icons/lucide/calendar.svelte';
	import IconCheckSquare from '$lib/icons/lucide/square-check-big.svelte';
	import IconNotebook from '$lib/icons/lucide/notebook-pen.svelte';
	import IconLibrary from '$lib/icons/lucide/library.svelte';
	import IconUsers from '$lib/icons/lucide/users.svelte';
	import IconActivity from '$lib/icons/lucide/activity.svelte';
	import IconClock from '$lib/icons/lucide/clock.svelte';
	import IconWallet from '$lib/icons/lucide/wallet.svelte';
	import IconRss from '$lib/icons/lucide/rss.svelte';
	import IconClipboard from '$lib/icons/lucide/clipboard.svelte';
	import type { FeatureType } from '$lib/config/navigation';
	import type { WelcomeTourRecords } from '$lib/types/translation';
	import { getNavigation } from '$lib/state/Navigation.svelte';

	const ts = getTranslation();
	const nav = getNavigation();

	const featureConfig: {
		key: FeatureType;
		icon: typeof IconCalendar;
		labelKey: keyof WelcomeTourRecords;
		descKey: keyof WelcomeTourRecords;
	}[] = [
		{ key: 'calendar' as FeatureType, icon: IconCalendar, labelKey: 'feature_calendar', descKey: 'feature_calendar_desc' },
		{ key: 'todos' as FeatureType, icon: IconCheckSquare, labelKey: 'feature_todos', descKey: 'feature_todos_desc' },
		{ key: 'notes' as FeatureType, icon: IconNotebook, labelKey: 'feature_notes', descKey: 'feature_notes_desc' },
		{ key: 'libraries' as FeatureType, icon: IconLibrary, labelKey: 'feature_libraries', descKey: 'feature_libraries_desc' },
		{ key: 'contacts' as FeatureType, icon: IconUsers, labelKey: 'feature_contacts', descKey: 'feature_contacts_desc' },
		{ key: 'checkIn' as FeatureType, icon: IconActivity, labelKey: 'feature_check_in', descKey: 'feature_check_in_desc' },
		{ key: 'timeTracking' as FeatureType, icon: IconClock, labelKey: 'feature_time_tracking', descKey: 'feature_time_tracking_desc' },
		{ key: 'finances' as FeatureType, icon: IconWallet, labelKey: 'feature_finances', descKey: 'feature_finances_desc' },
		{ key: 'feeds' as FeatureType, icon: IconRss, labelKey: 'feature_feeds', descKey: 'feature_feeds_desc' },
		{ key: 'clipboard' as FeatureType, icon: IconClipboard, labelKey: 'feature_clipboard', descKey: 'feature_clipboard_desc' }
	];

	function toggleFeature(key: FeatureType): void {
		nav.features[key] = !nav.features[key];
	}
</script>

<div in:blur={{ duration: 200 }}>
	<div class="mb-2 flex items-center gap-3">
		<div class="flex size-10 items-center justify-center rounded-xl bg-c-btn/10">
			<IconLayoutGrid class="size-5 text-c-btn" />
		</div>
		<div>
			<h2 class="text-2xl font-bold text-c-neutral-9 dark:text-white">
				{ts.get.welcome_tour.features_title}
			</h2>
			<p class="text-sm text-c-neutral-5 dark:text-c-neutral-4">
				{ts.get.welcome_tour.features_subtitle}
			</p>
		</div>
	</div>
	<p class="mb-6 text-sm text-c-neutral-6 dark:text-c-neutral-4">
		{ts.get.welcome_tour.features_description}
	</p>

	<div class="grid grid-cols-2 gap-3">
		{#each featureConfig as feature (feature.key)}
			<button
				class="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-left transition-all
					{nav.features[feature.key]
					? 'border-c-btn bg-c-btn/5 dark:bg-c-btn/10'
					: 'border-c-neutral-2 hover:border-c-neutral-3 dark:border-s-dark-3'}"
				onclick={() => toggleFeature(feature.key)}
			>
				<div
					class="flex size-8 shrink-0 items-center justify-center rounded-lg
					{nav.features[feature.key]
						? 'bg-c-btn text-white'
						: 'bg-c-neutral-1 text-c-neutral-5 dark:bg-s-dark-3 dark:text-c-neutral-4'}"
				>
					<svelte:component this={feature.icon} class="size-4" />
				</div>
				<div class="min-w-0">
					<div class="truncate text-sm font-medium text-c-neutral-9 dark:text-white">
						{ts.get.welcome_tour[feature.labelKey]}
					</div>
					<div class="line-clamp-2 text-xs text-c-neutral-5 dark:text-c-neutral-4">
						{ts.get.welcome_tour[feature.descKey]}
					</div>
				</div>
			</button>
		{/each}
	</div>
</div>
