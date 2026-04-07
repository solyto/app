<script lang="ts">
	import { fly } from 'svelte/transition';
	import IconEllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import NavEntry from '$lib/components/ui/NavEntry.svelte';
	import { page } from '$app/state';
	import { urls } from '$lib/config/urls';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { onMount } from 'svelte';
	import NavEntryIcon from '$lib/components/ui/NavEntryIcon.svelte';
	import { getFeatures } from '$lib/state/Features.svelte';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { getAuth } from '$lib/state/Auth.svelte';
	import IconScale from '@lucide/svelte/icons/scale';
	import { clickOutside } from '$lib/helpers/ClickHelper';

	const auth = getAuth();
	const ts = getTranslation();
	const features = getFeatures();

	let submenuVisible = $state<boolean>(false);

	onMount(async () => {
		await features.load();

		const pathname = page.url.pathname.substring(1),
			section = pathname.split('/');

		if (section[0] !== '') {
			active = section[0];
		}
	});

	function select(slug: string): void {
		submenuVisible = false;
		active = slug;
	}

	let active = $state<string>('home');
	let legalOpen = $state<boolean>(false);
	let legalClosedByOutside = false;
	let legalX = $state<number>(0);
	let legalY = $state<number>(0);
</script>

<div class="nav-mobile-container h-full p-1 bg-c-bg">
	<div
		class="nav-mobile gradient-right flex h-full w-full flex-row items-center justify-center rounded-md p-1 text-c-neutral-8 drop-shadow-xl dark:text-c-neutral-2"
	>
		<NavEntry
			slug="home"
			href={urls.home}
			title={ts.get.nav.home}
			active={active === 'home'}
			mobile={true}
			dataTour="home"
			onSelect={select}
		>
			<NavEntryIcon type="home" />
		</NavEntry>
		{#if features.features.todos}
			<NavEntry
				slug="todos"
				href={urls.todos}
				title={ts.get.nav.todos}
				active={active === 'todos'}
				mobile={true}
				dataTour="todos"
				onSelect={select}
			>
				<NavEntryIcon type="todos" />
			</NavEntry>
		{/if}
		{#if features.features.notes}
			<NavEntry
				slug="notes"
				href={urls.notes}
				title={ts.get.nav.notes}
				active={active === 'notes'}
				mobile={true}
				dataTour="notes"
				onSelect={select}
			>
				<NavEntryIcon type="notes" />
			</NavEntry>
		{/if}
		{#if features.features.checkIn}
			<NavEntry
				slug="check-in"
				href={urls.checkIn}
				title={ts.get.nav.checkIn}
				active={active === 'check-in'}
				mobile={true}
				dataTour="checkIn"
				onSelect={select}
			>
				<NavEntryIcon type="checkIn" />
			</NavEntry>
		{/if}
		{#if features.features.libraries}
			<NavEntry
				slug="libraries"
				href={urls.libraries}
				title={ts.get.nav.libraries}
				active={active === 'libraries'}
				mobile={true}
				dataTour="libraries"
				onSelect={select}
			>
				<NavEntryIcon type="libraries" />
			</NavEntry>
		{/if}
		<div
			class="relative flex h-full items-center justify-center rounded-sm"
			class:bg-c-btn={submenuVisible}
			class:text-white={submenuVisible}
		>
			<button
				class="cursor-pointer p-4"
				onclick={() => {
					submenuVisible = !submenuVisible;
				}}
			>
				<IconEllipsisVertical />
			</button>
			{#if submenuVisible}
				<div
					class="gradient-down absolute z-50 flex flex-col gap-2 rounded-lg p-1 text-c-neutral-8 shadow-lg dark:text-c-neutral-2"
					style="bottom:80px; right:15px;"
					transition:fly={{ x: 50, duration: 200 }}
				>
					{#if features.features.calendar}
						<NavEntry
							slug="calendar"
							href={urls.calendar}
							title={ts.get.nav.feeds}
							active={active === 'calendar'}
							mobile={true}
							onSelect={select}
						>
							<NavEntryIcon type="calendar" />
						</NavEntry>
					{/if}
					{#if features.features.contacts}
						<NavEntry
							slug="contacts"
							href={urls.contacts}
							title={ts.get.nav.contacts}
							active={active === 'contacts'}
							mobile={true}
							onSelect={select}
						>
							<NavEntryIcon type="contacts" />
						</NavEntry>
					{/if}
					{#if features.features.finances}
						<NavEntry
							slug="finances"
							href={urls.finances}
							title={ts.get.nav.finances}
							active={active === 'finances'}
							mobile={true}
							fixedWidth={true}
							onSelect={select}
						>
							<NavEntryIcon type="finances" />
						</NavEntry>
					{/if}
					{#if features.features.timeTracking}
					<NavEntry
						slug="time-tracking"
						href={urls.timeTracking}
						title={ts.get.nav.timeTracking}
						active={active === 'time-tracking'}
						mobile={true}
						fixedWidth={true}
						onSelect={select}
					>
						<NavEntryIcon type="timer" />
					</NavEntry>
				{/if}
				{#if features.features.feeds}
						<NavEntry
							slug="feeds"
							href={urls.feeds}
							title={ts.get.nav.feeds}
							active={active === 'feeds'}
							mobile={true}
							fixedWidth={true}
							onSelect={select}
						>
							<NavEntryIcon type="feeds" />
						</NavEntry>
					{/if}
					{#if features.features.clipboard}
						<NavEntry
							slug="clipboard"
							href={urls.clipboard}
							title={ts.get.nav.clipboard}
							active={active === 'clipboard'}
							mobile={true}
							onSelect={select}
						>
							<NavEntryIcon type="clipboard" />
						</NavEntry>
					{/if}
					{#if features.features.dev_requests}
						<NavEntry
							slug="dev-requests"
							href={urls.devRequests}
							title={ts.get.nav.dev_requests}
							active={active === 'dev-requests'}
							mobile={true}
							fixedWidth={true}
							onSelect={select}
						>
							<NavEntryIcon type="dev_requests" />
						</NavEntry>
					{/if}
					<NavEntry
						slug="settings"
						href={urls.settings}
						title={ts.get.nav.settings}
						active={active === 'settings'}
						mobile={true}
						fixedWidth={true}
						onSelect={select}
					>
						<NavEntryIcon type="settings" />
					</NavEntry>
					<NavEntry
						slug="profile"
						href={urls.profile}
						title={ts.get.nav.profile}
						active={active === 'profile'}
						mobile={true}
						onSelect={select}
					>
						<div
							class="flex size-10 items-center justify-center rounded-full bg-c-neutral-2 text-black"
						>
							{#if auth.user?.profile?.profile_image_path}
								<img
									src={API_USER_STORAGE_URL +
										'/' +
										auth.user.profile.profile_image_path}
									alt="Profile Image"
									class="h-full w-full rounded-full object-cover"
								/>
							{:else}
								{auth.user?.name?.[0]?.toUpperCase()}
							{/if}
						</div>
					</NavEntry>
					<div class="relative w-full">
						<button
							class="flex h-12 w-full cursor-pointer items-center justify-center rounded-sm transition-all"
							title={ts.get.layout.legal_notice}
							onclick={(e) => {
								if (legalClosedByOutside) {
									legalClosedByOutside = false;
									return;
								}
								legalX = window.innerWidth - e.clientX;
								legalY = window.innerHeight - e.clientY + 20;
								legalOpen = !legalOpen;
							}}
						>
							<IconScale />
						</button>
						{#if legalOpen}
							<div
								class="fixed z-[9999] flex min-w-48 flex-col gap-2 rounded-lg bg-c-bg-elevated px-4 py-3 shadow-lg"
								style="bottom: {legalY}px; right: {legalX}px;"
								use:clickOutside={() => {
									legalOpen = false;
									legalClosedByOutside = true;
								}}
							>
								<a
									href="{urls.landingPage}/#legal-notice"
									target="_blank"
									class="text-sm hover:text-c-primary"
									>{ts.get.layout.legal_notice}</a
								>
								<a
									href="{urls.landingPage}/#privacy"
									target="_blank"
									class="text-sm hover:text-c-primary"
									>{ts.get.layout.privacy_policy}</a
								>
								<a
									href="{urls.landingPage}/#terms"
									target="_blank"
									class="text-sm hover:text-c-primary"
									>{ts.get.layout.terms_of_service}</a
								>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
