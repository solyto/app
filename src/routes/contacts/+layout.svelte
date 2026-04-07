<script lang="ts">
	import { setContacts } from '$lib/state/Contacts.svelte.js';

	setContacts();

	let { children } = $props();
</script>

{@render children?.()}
