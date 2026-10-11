<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import IconNotebook from '@lucide/svelte/icons/notebook';
	import IconGoal from '@lucide/svelte/icons/goal';
	import { urls } from '$lib/config/urls';
	import { getUrlFormat } from '$lib/helpers/DateHelper';
	import { getCalendars } from '$lib/state/Calendars.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';

	// Two quiet life marks for one calendar day: journal (notebook icon) and
	// check-in (goal icon). A solid icon means an entry already exists for the
	// day; a dim outline links into creating one. Both drop the user on the
	// respective day page. Both are opt-in via user settings and show the
	// scoped marks the calendar fetch provides.
	let { date, compact = false } = $props<{ date: Date; compact?: boolean }>();

	const calendars = getCalendars();
	const auth = getAuth();
	const ts = getTranslation();

	const dateKey = $derived(getUrlFormat(date));
	const todayKey = $derived(getUrlFormat(new Date()));
	const reachable = $derived(dateKey <= todayKey);
	const hasJournal = $derived(calendars.journalMarks.includes(dateKey));
	const hasCheckIn = $derived(calendars.checkInMarks.includes(dateKey));
	const journalEnabled = $derived(auth.user?.settings?.journal_enabled ?? false);
	const journalMarkEnabled = $derived(auth.user?.settings?.journal_calendar_mark ?? false);
	const checkInMarkEnabled = $derived(auth.user?.settings?.check_in_calendar_mark ?? false);
	const iconClass = compact ? 'size-3' : 'size-3.5';

	function openJournal(): void {
		goto(resolve(urls.journalDate, { date: dateKey }));
	}

	function openCheckIn(): void {
		goto(resolve(urls.checkInDate, { date: dateKey }));
	}
</script>

{#if reachable}
	<div class="flex items-center gap-1.5">
		{#if journalEnabled && journalMarkEnabled}
			<span
				role="button"
				tabindex="-1"
				title={ts.get.calendar.life_journal}
				onclick={(e: MouseEvent) => {
					e.stopPropagation();
					openJournal();
				}}
				class="shrink-0 cursor-pointer transition-transform duration-200 hover:scale-125"
			>
				<IconNotebook
					class="{iconClass} {hasJournal
						? 'text-c-action'
						: 'text-c-neutral-4 dark:text-c-neutral-6'}"
				/>
			</span>
		{/if}
		{#if checkInMarkEnabled}
			<span
				role="button"
				tabindex="-1"
				title={ts.get.calendar.life_check_in}
				onclick={(e: MouseEvent) => {
					e.stopPropagation();
					openCheckIn();
				}}
				class="shrink-0 cursor-pointer transition-transform duration-200 hover:scale-125"
			>
				<IconGoal
					class="{iconClass} {hasCheckIn
						? 'text-c-primary'
						: 'text-c-neutral-4 dark:text-c-neutral-6'}"
				/>
			</span>
		{/if}
	</div>
{/if}
