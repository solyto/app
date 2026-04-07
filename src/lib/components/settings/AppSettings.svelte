<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getPwaInstall } from '$lib/state/PwaInstall.svelte';
	import { getWelcomeTour } from '$lib/state/WelcomeTour.svelte.js';
	import { getFeatures } from '$lib/state/Features.svelte.js';
	import { getThemeState } from '$lib/state/Theme.svelte.js';
	import Card from '$lib/components/ui/Card.svelte';
	import IconSmartphone from '@lucide/svelte/icons/smartphone';
	import IconCheckCircle from '@lucide/svelte/icons/check-circle';
	import IconMapPin from '@lucide/svelte/icons/map-pin';
	import { themes } from '$lib/config/themes';

	const ts = getTranslation();
	const pwa = getPwaInstall();
	const tour = getWelcomeTour();
	const features = getFeatures();
	const themeState = getThemeState();
</script>

<div class="flex flex-col gap-6 md:p-4">
	<Card label="Theme" hover={false} fullWidth={true}>
		<div class="mt-2 flex flex-wrap items-stretch gap-3">
			{#each themes as t (t.id)}
				{@const active = themeState.theme.id === t.id}
				<button
					class="cursor-pointer overflow-hidden rounded-lg border-2 transition-all"
					style="border-color: {active ? t.previewAccent : 'transparent'};"
					onclick={() => themeState.setTheme(t)}
				>
					<div
						class="flex h-full w-32 flex-col gap-1 p-3"
						style="background-color: {t.previewBg}; color: {t.previewText};"
					>
						<div class="h-2 w-8 rounded-full" style="background-color: {t.previewAccent};"></div>
						<div class="h-1.5 w-16 rounded-full opacity-60" style="background-color: {t.previewText};"></div>
						<div class="h-1.5 w-12 rounded-full opacity-40" style="background-color: {t.previewText};"></div>
						<div class="grow"></div>
						<div
							class="mt-1 rounded px-1.5 py-0.5 text-left text-xs font-medium"
							style="background-color: {t.previewSurface}; color: {t.previewText};"
						>
							{t.name}
						</div>
					</div>
				</button>
			{/each}
		</div>
	</Card>
	<Card label={ts.get.welcome_tour.tour_start} hover={false}>
		<button
			class="mt-2 flex cursor-pointer items-center gap-2 rounded-lg bg-c-btn px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-c-btn/80"
			onclick={() => tour.start(features)}
		>
			<IconMapPin size={15} />
			{ts.get.welcome_tour.tour_start}
		</button>
	</Card>
	<Card label={ts.get.welcome_tour.pwa_title} hover={false}>
		<p class="text-sm text-c-neutral-5 dark:text-c-neutral-4">
			{ts.get.welcome_tour.pwa_description}
		</p>
		{#if pwa.installed}
			<div class="mt-4 flex items-center gap-2 text-sm text-c-primary">
				<IconCheckCircle size={15} />
				<span>{ts.get.welcome_tour.pwa_installed}</span>
			</div>
		{:else if pwa.canInstall}
			<button
				class="mt-4 flex cursor-pointer items-center gap-2 rounded-lg bg-c-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-c-primary/80"
				onclick={() => pwa.install()}
			>
				<IconSmartphone size={15} />
				{ts.get.welcome_tour.pwa_install_button}
			</button>
		{:else if pwa.isIos}
			<p class="mt-4 text-sm text-c-neutral-5 dark:text-c-neutral-4">
				{ts.get.welcome_tour.pwa_ios_instruction}
			</p>
		{:else}
			<p class="mt-4 text-sm text-c-neutral-5 dark:text-c-neutral-4">
				{ts.get.welcome_tour.pwa_browser_hint}
			</p>
		{/if}
	</Card>
</div>

