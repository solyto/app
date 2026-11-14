<script lang="ts">
	import { onMount } from 'svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import ExternalAccountEntry from '$lib/components/calendars/ExternalAccountEntry.svelte';
	import { getExternalCalendars } from '$lib/state/ExternalCalendars.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';

	const externalCalendars = getExternalCalendars();
	const ts = getTranslation();

	onMount(() => externalCalendars.load());

	function connect(): void {
		externalCalendars.openDialog({ step: 'connect' });
	}
</script>

<div class="flex flex-col gap-2">
	<p class="px-1 text-xs font-semibold uppercase tracking-wider text-c-neutral-4">
		{ts.get.calendar.connected_accounts}
	</p>
	{#each externalCalendars.accounts as account (account.id)}
		<ExternalAccountEntry {account} />
	{/each}
	{#if externalCalendars.loaded && externalCalendars.accounts.length === 0}
		<p class="px-1 text-sm text-c-neutral-4">{ts.get.calendar.no_connected_accounts}</p>
	{/if}
	<TextButton title={ts.get.calendar.connect_calendar} type="slight" onclick={connect} class="self-end" />
</div>
