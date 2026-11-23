<script lang="ts">
	import { setNavigation } from '$lib/state/Navigation.svelte';
	import { setCheckInData } from '$lib/state/CheckInData.svelte';
	import { setGoals } from '$lib/state/Goals.svelte';
	import { setShortcuts } from '$lib/state/Shortcuts.svelte';
	import QuickGlance from '$lib/components/dashboard/QuickGlance.svelte';

	const nav = setNavigation();
	nav.features.timeTracking = false;
	setCheckInData();
	setGoals();
	setShortcuts();
</script>

<QuickGlance />
