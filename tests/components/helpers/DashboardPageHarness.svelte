<script lang="ts">
	import { setNavigation } from '$lib/state/Navigation.svelte';
	import { setWelcomeTour } from '$lib/state/WelcomeTour.svelte';
	import { setQuickAdd } from '$lib/state/QuickAdd.svelte';
	import DashboardPage from '../../../src/routes/+page.svelte';

	let { checkIn }: { checkIn: boolean } = $props();

	const nav = setNavigation();
	// svelte-ignore state_referenced_locally
	nav.features.checkIn = checkIn;
	nav.features.todos = false;
	setWelcomeTour();
	setQuickAdd();
</script>

<DashboardPage />
