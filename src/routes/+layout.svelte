<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import DesktopNavbar from '$lib/components/ui/DesktopNavbar.svelte';
	import MobileNavbar from '$lib/components/ui/MobileNavbar.svelte';
	import LoadingIndicator from '$lib/components/ui/LoadingIndicator.svelte';
	import Notifications from '$lib/components/ui/Notifications.svelte';
	import { setViewPoint, getViewPoint } from '$lib/state/Viewpoint.svelte.js';
	import { setAuth, getAuth } from '$lib/state/Auth.svelte.js';
	import { getTranslation, setTranslation } from '$lib/state/Translation.svelte.js';
	import { setLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getKeyManager, setKeyManager } from '$lib/KeyManager.svelte.js';
	import { setUiNotifications } from '$lib/state/UiNotifications.svelte.js';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { urls } from '$lib/config/urls';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { setUserNotifications } from '$lib/state/UserNotifications.svelte.js';
	import { setFeatures } from '$lib/state/Features.svelte.js';
	import { getHelp, setHelp } from '$lib/state/Help.svelte';
	import HelpOverlay from '$lib/components/help/HelpOverlay.svelte';
	import { setCookieConsent } from '$lib/state/CookieConsent.svelte';
	import CookieBanner from '$lib/components/ui/CookieBanner.svelte';
	import { getPwaInstall, setPwaInstall } from '$lib/state/PwaInstall.svelte';
	import { setWelcomeTour } from '$lib/state/WelcomeTour.svelte.js';
	import WelcomeTour from '$lib/components/tour/WelcomeTour.svelte';
	import { setThemeState } from '$lib/state/Theme.svelte.js';

	let { children } = $props();

	setViewPoint();
	setAuth();
	setTranslation();
	setKeyManager();
	setLoadingIndicator();
	setUiNotifications();
	setUserNotifications();
	setFeatures();
	setHelp();
	setCookieConsent();
	setPwaInstall();
	setWelcomeTour();
	const theme = setThemeState();

	const viewPoint = getViewPoint();
	const auth = getAuth();
	const keyManager = getKeyManager();
	const ts = getTranslation();
	const help = getHelp();
	const pwa = getPwaInstall();

	let innerHeight = $state<number>(0);

	onMount(() => {
		theme.load();
		if (!auth.loggedIn && page.route.id !== '/auth/register') goto(resolve(urls.login));

		const updateHeight = () => {
			innerHeight = window.innerHeight;
		};

		updateHeight();
		window.addEventListener('resize', updateHeight);

		ts.loadLanguage();

		if (viewPoint.isDesktop) {
			keyManager.registerKeyDown('F1', () => help.handleF1(), { preventOthers: false });
		}

		return () => window.removeEventListener('resize', updateHeight);
	});

	function showNavbar(): boolean {
		return !isAuthRoute() && !isAdminRoute();
	}

	function isAdminRoute(): boolean {
		return page.url.pathname.startsWith('/admin');
	}

	function isAuthRoute(): boolean {
		return (
			page.url.pathname == urls.login ||
			page.url.pathname == urls.logout ||
			page.url.pathname == urls.register
		);
	}
</script>

<svelte:head>
	<title>s o l y t o</title>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/site.webmanifest" />
</svelte:head>

<div class="flex w-screen flex-col overflow-hidden 2xl:flex-row bg-c-bg page-container" style="height: {innerHeight}px;">
	<LoadingIndicator />
	<Notifications />
	{#if viewPoint.isDesktop && showNavbar()}
		<div class="z-[100] hidden h-full 2xl:block">
			<DesktopNavbar />
		</div>
	{/if}
	<div class="min-h-0 w-full grow overflow-auto content-container">
		{@render children?.()}
	</div>
	{#if !viewPoint.isDesktop && showNavbar()}
		<div class="z-[100] block h-16 w-full 2xl:hidden">
			<MobileNavbar />
		</div>
	{/if}
	{#if help.visible}
		<HelpOverlay />
	{/if}
	<WelcomeTour />
	{#if !isAuthRoute()}
		<CookieBanner />
	{/if}
</div>

<!-- italic text-orange-500 text-green-300 c-warning bg-gradient-to-r from-c-success via-c-btn via-c-danger-hover via-c-action to-c-warning text-c-success text-c-btn-hover text-c-danger -->

<svelte:window
	bind:innerHeight
	onkeydown={(e) => keyManager.handleKeyDown(e)}
	onkeyup={(e) => keyManager.handleKeyUp(e)}
/>
