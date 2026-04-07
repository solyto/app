<script lang="ts">
	import { slide } from 'svelte/transition';
	import { getHelp, type HelpSection } from '$lib/state/Help.svelte';
	import CloseButton from '$lib/components/ui/buttons/CloseButton.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import type { Component } from 'svelte';

	// Lucide icons
	import IconCircleHelp from '@lucide/svelte/icons/circle-help';
	import IconHome from '@lucide/svelte/icons/home';
	import IconClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import IconCalendar from '@lucide/svelte/icons/calendar';
	import IconFileText from '@lucide/svelte/icons/file-text';
	import IconLibrary from '@lucide/svelte/icons/library';
	import IconUsers from '@lucide/svelte/icons/users';
	import IconChartBar from '@lucide/svelte/icons/chart-bar';
	import IconMessageSquare from '@lucide/svelte/icons/message-square';
	import IconDollarSign from '@lucide/svelte/icons/dollar-sign';
	import IconRss from '@lucide/svelte/icons/rss';
	import IconClipboard from '@lucide/svelte/icons/clipboard';
	import IconSettings from '@lucide/svelte/icons/settings';
	import IconUser from '@lucide/svelte/icons/user';
	import IconCode from '@lucide/svelte/icons/code';
	import IconTimer from '@lucide/svelte/icons/timer';
	import IconLightbulb from '@lucide/svelte/icons/lightbulb';
	import IconKeyboard from '@lucide/svelte/icons/keyboard';
	import IconCheck from '@lucide/svelte/icons/check';

	const help = getHelp();
	const ts = getTranslation();

	const section = $derived(help.getCurrentSection());
	const sectionData = $derived(ts.get.help[section]);

	function getTips(section: HelpSection): string[] {
		const data = ts.get.help[section];
		return Object.entries(data)
			.filter(([key]) => key.endsWith('_tip'))
			.map(([, value]) => value as string);
	}

	const tips = $derived(getTips(section));

	const sectionIcons: Record<HelpSection, Component> = {
		home: IconHome,
		todos: IconClipboardCheck,
		calendar: IconCalendar,
		notes: IconFileText,
		libraries: IconLibrary,
		contacts: IconUsers,
		checkIn: IconChartBar,
		assistants: IconMessageSquare,
		timeTracking: IconTimer,
		finances: IconDollarSign,
		feeds: IconRss,
		clipboard: IconClipboard,
		settings: IconSettings,
		profile: IconUser,
		dev_requests: IconCode
	};

	const SectionIcon = $derived(sectionIcons[section]);
</script>

<div
	class="fixed top-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden bg-c-bg-modal shadow-2xl backdrop-blur-sm md:w-1/3 md:max-w-[400px]"
	transition:slide={{ axis: 'x', duration: 200 }}
>
	<div
		class="flex items-center justify-between border-b border-c-neutral-2 p-4 dark:border-s-dark-3"
	>
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-c-btn/10 p-2 dark:bg-c-primary/10">
				<IconCircleHelp
					class="h-5 w-5 text-c-btn dark:text-c-primary"
					strokeWidth={1.5}
				/>
			</div>
			<h1 class="text-lg font-bold text-c-neutral-9 dark:text-white">{ts.get.help.title}</h1>
		</div>
		<CloseButton inModal={false} onClick={() => help.close()} />
	</div>

	<div class="flex-1 space-y-6 overflow-y-auto p-4">
		<div
			class="flex items-start gap-3 rounded-xl border border-c-btn/20 bg-gradient-to-br from-c-btn/5 to-c-primary/5 p-4 dark:border-c-primary/20 dark:from-c-btn/10 dark:to-c-primary/10"
		>
			<div class="flex-shrink-0 rounded-lg bg-c-bg p-2.5 shadow-sm dark:bg-s-dark-2">
				<SectionIcon class="h-6 w-6 text-c-btn dark:text-c-primary" strokeWidth={1.5} />
			</div>
			<div class="min-w-0 flex-1">
				<h2 class="mb-1 text-base font-semibold text-c-neutral-9 dark:text-white">
					{sectionData.title}
				</h2>
				<p class="text-sm leading-relaxed text-c-neutral-6 dark:text-c-neutral-3">
					{sectionData.description}
				</p>
			</div>
		</div>

		{#if tips.length > 0}
			<div>
				<h3
					class="mb-3 flex items-center gap-2 text-sm font-semibold text-c-neutral-7 dark:text-c-neutral-2"
				>
					<IconLightbulb class="h-4 w-4 text-amber-500" strokeWidth={1.5} />
					{ts.get.help.tips}
				</h3>
				<ul class="space-y-2">
					{#each tips as tip}
						<li
							class="flex items-start gap-2.5 rounded-lg bg-c-neutral p-3 dark:bg-s-dark-2"
						>
							<IconCheck
								class="mt-0.5 h-4 w-4 flex-shrink-0 text-c-btn dark:text-c-primary"
								strokeWidth={2}
							/>
							<span class="text-sm text-c-neutral-6 dark:text-c-neutral-3">{tip}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div>
			<h3
				class="mb-3 flex items-center gap-2 text-sm font-semibold text-c-neutral-7 dark:text-c-neutral-2"
			>
				<IconKeyboard class="h-4 w-4 text-purple-500" strokeWidth={1.5} />
				{ts.get.help.keyboard_shortcuts}
			</h3>
			<div class="space-y-2">
				{@render shortcut(ts.get.help.shortcut_f1, 'F1')}
				{@render shortcut(ts.get.help.shortcut_escape, 'Esc')}
				{@render shortcut(ts.get.help.shortcut_enter, 'Enter')}
				{#if section === 'todos'}
					{@render shortcut(ts.get.help.shortcut_enter_todo, 'Enter', true)}
				{/if}
			</div>
		</div>
	</div>

	<div class="border-t border-c-neutral-2 bg-c-neutral p-4 dark:border-s-dark-3 dark:bg-s-dark-2">
		<p class="text-center text-xs text-c-neutral-5 dark:text-c-neutral-4">
			Press {@render kbd('F1')} anytime to toggle this panel
		</p>
	</div>
</div>

{#snippet shortcut(label: string, key: string, highlighted: boolean = false)}
	<div
		class="flex items-center justify-between rounded-lg p-3 {highlighted
			? 'border border-c-btn/30 bg-c-btn/10 dark:bg-c-btn/20'
			: 'bg-c-neutral dark:bg-s-dark-2'}"
	>
		<span class="text-sm text-c-neutral-6 dark:text-c-neutral-3">{label}</span>
		{@render kbd(key)}
	</div>
{/snippet}

{#snippet kbd(key: string)}
	<kbd
		class="dark:border-s-dark-4 rounded border border-c-neutral-2 bg-c-bg px-2 py-1 font-mono text-xs font-medium text-c-neutral-7 shadow-sm dark:bg-s-dark-3 dark:text-c-neutral-2"
		>{key}</kbd
	>
{/snippet}
