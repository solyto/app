<script lang="ts">
	import type { Component } from 'svelte';
	import { setContacts, type Contacts } from '$lib/state/Contacts.svelte';

	let {
		component: Inner,
		props = {},
		onReady
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		props?: Record<string, unknown>;
		onReady: (contacts: Contacts) => void;
	} = $props();

	const contacts = setContacts();
	// svelte-ignore state_referenced_locally
	onReady(contacts);
</script>

<Inner {...props} />
