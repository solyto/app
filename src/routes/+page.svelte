<script lang="ts">
	import { setTodos, getTodos } from '$lib/state/Todos.svelte.js';
	import { onMount } from 'svelte';
	import { setCalendars } from '$lib/state/Calendars.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { setWeather } from '$lib/state/Weather.svelte.js';
	import { setCheckInData } from '$lib/state/CheckInData.svelte.js';
	import { setShortcuts } from '$lib/state/Shortcuts.svelte.js';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { setFeatures, getFeatures } from '$lib/state/Features.svelte';
	import { getWelcomeTour } from '$lib/state/WelcomeTour.svelte.js';
	import { setTimeTracking } from '$lib/state/TimeTracking.svelte.js';
	import OnboardingModal from '$lib/components/dashboard/OnboardingModal.svelte';
	import YourDay from '$lib/components/dashboard/YourDay.svelte';
	import Inspiration from '$lib/components/dashboard/Inspiration.svelte';
	import QuickGlance from '$lib/components/dashboard/QuickGlance.svelte';

	setTodos();
	setCalendars();
	setWeather();
	setCheckInData();
	setShortcuts();
	setFeatures();
	setTimeTracking();

	const todos = getTodos();
	const loadingIndicator = getLoadingIndicator();
	const auth = getAuth();
	const features = getFeatures();
	const tour = getWelcomeTour();

	let showOnboardingModal = $state<boolean>(true);

	onMount(async () => {
		loadingIndicator.start();
		await todos.load();
		loadingIndicator.stop();

		if (auth.user?.settings?.first_visit) {
			showOnboardingModal = true;
		}
	});

	function handleOnboardingModalComplete(): void {
		showOnboardingModal = false;
		tour.start(features);
	}
</script>

{#if showOnboardingModal}
	<OnboardingModal onComplete={handleOnboardingModalComplete} />
{/if}

<div class="h-full w-full p-8">
	<div class="flex w-full flex-col gap-6 md:flex-row md:gap-0">
		<div class="w-full md:w-3/12 md:pr-10 md:pb-8">
			<YourDay />
		</div>
		<div
			class="w-full border-t border-c-neutral-1 pt-6 md:w-5/12 md:border-x md:border-t-0 md:px-10 md:pt-0 md:pb-8 dark:border-s-dark-3"
		>
			<Inspiration />
		</div>
		<div
			class="w-full border-t border-c-neutral-1 pt-6 pb-6 md:w-4/12 md:border-t-0 md:pt-0 md:pb-8 md:pl-10 dark:border-s-dark-3"
		>
			<QuickGlance />
		</div>
	</div>
</div>
