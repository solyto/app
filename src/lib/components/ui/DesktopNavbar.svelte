<script lang="ts">
	import NavEntry from '$lib/components/ui/NavEntry.svelte';
	import logo from '$lib/assets/logo_cut.png';

	import { page } from '$app/state';
	import { urls } from '$lib/config/urls';
	import { slide } from 'svelte/transition';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { onMount } from 'svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import UserNotifications from '$lib/components/ui/user-notifications/UserNotifications.svelte';
	import { getFeatures } from '$lib/state/Features.svelte';
	import NavEntryIcon from '$lib/components/ui/NavEntryIcon.svelte';
	import IconScale from '@lucide/svelte/icons/scale';
	import { clickOutside } from '$lib/helpers/ClickHelper';

	const auth = getAuth();
	const ts = getTranslation();
	const features = getFeatures();

	let profileImageAvailable = $derived(auth.user?.profile?.profile_image_path);

	onMount(async () => {
		await features.load();

		const pathname = page.url.pathname.substring(1),
			section = pathname.split('/');

		if (section[0] !== '') {
			active = section[0];
		}
	});

	function select(slug: string): void {
		active = slug;
	}

	let active = $state<string>('home');
	let legalOpen = $state<boolean>(false);
	let legalClosedByOutside = false;
	let legalX = $state<number>(0);
	let legalY = $state<number>(0);
</script>

<div class="nav-desktop-container h-full bg-c-bg p-1" transition:slide={{ axis: 'x' }}>
	<div
		class="nav-desktop gradient-down flex h-full w-16 flex-col rounded-md p-1 text-c-neutral-8 drop-shadow-xl dark:text-c-neutral-2"
	>
		<div class="relative mb-auto flex flex-col items-center">
			<img src={logo} class="logo" alt="logo" />
			<div
				class="absolute bottom-[-24px] rounded-full bg-c-btn-hover px-2 py-1 text-xs text-white shadow-sm"
			>
				Beta
			</div>
		</div>

		<div class="flex flex-1 flex-col items-center justify-center">
			<div data-tour="home" class="w-full">
				<NavEntry
					slug="home"
					href={urls.home}
					title={ts.get.nav.home}
					active={active === 'home'}
					onSelect={select}
				>
					<NavEntryIcon type="home" />
				</NavEntry>
			</div>
			{#if features.features.calendar}
				<div data-tour="calendar" class="w-full">
					<NavEntry
						slug="calendar"
						href={urls.calendar}
						title={ts.get.nav.calendar}
						active={active === 'calendar'}
						onSelect={select}
					>
						<NavEntryIcon type="calendar" />
					</NavEntry>
				</div>
			{/if}
			{#if features.features.todos}
				<div data-tour="todos" class="w-full">
					<NavEntry
						slug="todos"
						href={urls.todos}
						title={ts.get.nav.todos}
						active={active === 'todos'}
						onSelect={select}
					>
						<NavEntryIcon type="todos" />
					</NavEntry>
				</div>
			{/if}
			{#if features.features.notes}
				<div data-tour="notes" class="w-full">
					<NavEntry
						slug="notes"
						href={urls.notes}
						title={ts.get.nav.notes}
						active={active === 'notes'}
						onSelect={select}
					>
						<NavEntryIcon type="notes" />
					</NavEntry>
				</div>
			{/if}
			{#if features.features.libraries}
				<div data-tour="libraries" class="w-full">
					<NavEntry
						slug="libraries"
						href={urls.libraries}
						title={ts.get.nav.libraries}
						active={active === 'libraries'}
						onSelect={select}
					>
						<NavEntryIcon type="libraries" />
					</NavEntry>
				</div>
			{/if}
			{#if features.features.contacts}
				<div data-tour="contacts" class="w-full">
					<NavEntry
						slug="contacts"
						href={urls.contacts}
						title={ts.get.nav.contacts}
						active={active === 'contacts'}
						onSelect={select}
					>
						<NavEntryIcon type="contacts" />
					</NavEntry>
				</div>
			{/if}
			{#if features.features.checkIn}
				<div data-tour="checkIn" class="w-full">
					<NavEntry
						slug="check-in"
						href={urls.checkIn}
						title={ts.get.nav.checkIn}
						active={active === 'check-in'}
						onSelect={select}
					>
						<NavEntryIcon type="checkIn" />
					</NavEntry>
				</div>
			{/if}
			{#if features.features.finances}
				<div data-tour="finances" class="w-full">
					<NavEntry
						slug="finances"
						href={urls.finances}
						title={ts.get.nav.finances}
						active={active === 'finances'}
						onSelect={select}
					>
						<NavEntryIcon type="finances" />
					</NavEntry>
				</div>
			{/if}
			{#if features.features.timeTracking}
				<div data-tour="timeTracking" class="w-full">
					<NavEntry
						slug="time-tracking"
						href={urls.timeTracking}
						title={ts.get.nav.timeTracking}
						active={active === 'time-tracking'}
						onSelect={select}
					>
						<NavEntryIcon type="timer" />
					</NavEntry>
				</div>
			{/if}
			{#if features.features.feeds}
				<div data-tour="feeds" class="w-full">
					<NavEntry
						slug="feeds"
						href={urls.feeds}
						title={ts.get.nav.feeds}
						active={active === 'feeds'}
						onSelect={select}
					>
						<NavEntryIcon type="feeds" />
					</NavEntry>
				</div>
			{/if}
			{#if features.features.clipboard}
				<div data-tour="clipboard" class="w-full">
					<NavEntry
						slug="clipboard"
						href={urls.clipboard}
						title={ts.get.nav.clipboard}
						active={active === 'clipboard'}
						onSelect={select}
					>
						<NavEntryIcon type="clipboard" />
					</NavEntry>
				</div>
			{/if}
		</div>

		<div class="mt-auto flex flex-col items-center">
			<div data-tour="profile" class="w-full">
				<NavEntry
					slug="profile"
					href={urls.profile}
					title={ts.get.nav.profile}
					active={active === 'profile'}
					onSelect={select}
				>
					<div
						class="flex size-10 items-center justify-center rounded-full bg-c-neutral-2 text-black"
					>
						{#if profileImageAvailable}
							<img
								src={API_USER_STORAGE_URL + '/' + auth.user.profile.profile_image_path}
								alt="Profile Image"
								class="h-full w-full rounded-full object-cover"
							/>
						{:else}
							{auth.user?.name?.[0]?.toUpperCase()}
						{/if}
					</div>
				</NavEntry>
			</div>
			<UserNotifications {select} />
			<div data-tour="settings" class="w-full">
				<NavEntry
					slug="settings"
					href={urls.settings}
					title={ts.get.nav.settings}
					active={active === 'settings'}
					onSelect={select}
				>
					<NavEntryIcon type="settings" />
				</NavEntry>
			</div>
			{#if features.features.dev_requests}
				<div data-tour="dev_requests" class="w-full">
					<NavEntry
						slug="dev_requests"
						href={urls.devRequests}
						title={ts.get.nav.dev_requests}
						active={active === 'dev_requests'}
						onSelect={select}
					>
						<NavEntryIcon type="dev_requests" />
					</NavEntry>
				</div>
			{/if}
			<div class="relative w-full">
				<button
					class="flex h-14 w-full cursor-pointer items-center justify-center rounded-sm transition-all hover:bg-c-nav-hover md:max-h-[5vh]"
					title={ts.get.layout.legal_notice}
					onclick={(e) => {
						if (legalClosedByOutside) {
							legalClosedByOutside = false;
							return;
						}
						legalX = e.clientX + 20;
						legalY = window.innerHeight - e.clientY;
						legalOpen = !legalOpen;
					}}
				>
					<IconScale />
				</button>
				{#if legalOpen}
					<div
						class="fixed z-[9999] flex min-w-48 flex-col gap-2 rounded-lg bg-c-bg-elevated px-4 py-3 shadow-sm"
						style="bottom: {legalY}px; left: {legalX}px;"
						use:clickOutside={() => {
							legalOpen = false;
							legalClosedByOutside = true;
						}}
					>
						<a
							href="{urls.landingPage}/#legal-notice"
							target="_blank"
							class="text-sm hover:text-c-primary">{ts.get.layout.legal_notice}</a
						>
						<a
							href="{urls.landingPage}/#privacy"
							target="_blank"
							class="text-sm hover:text-c-primary">{ts.get.layout.privacy_policy}</a
						>
						<a
							href="{urls.landingPage}/#terms"
							target="_blank"
							class="text-sm hover:text-c-primary">{ts.get.layout.terms_of_service}</a
						>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
