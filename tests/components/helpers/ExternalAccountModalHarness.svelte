<script lang="ts">
	import ExternalAccountModal from '$lib/components/calendars/ExternalAccountModal.svelte';
	import { setCalendars } from '$lib/state/Calendars.svelte';
	import { setExternalCalendars } from '$lib/state/ExternalCalendars.svelte';

	setCalendars();
	setExternalCalendars().openDialog({ step: 'connect' });
</script>

<ExternalAccountModal />
