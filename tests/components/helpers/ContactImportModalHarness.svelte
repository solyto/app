<script lang="ts">
	import { onDestroy } from 'svelte';
	import ImportModal from '$lib/components/contacts/ImportModal.svelte';
	import { setContacts } from '$lib/state/Contacts.svelte';
	import { setContactImport, type ContactImport } from '$lib/state/ContactImport.svelte';
	import type { AddressBook, ImportState } from '$lib/types/contact';

	let { addressBooks = [], state = null, onStore }: {
		addressBooks?: AddressBook[];
		state?: ImportState | null;
		onStore?: (store: ContactImport) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	setContacts().addressBooks = addressBooks;
	const contactImport = setContactImport();
	// svelte-ignore state_referenced_locally
	contactImport.state = state;
	contactImport.importModal = true;
	// svelte-ignore state_referenced_locally
	onStore?.(contactImport);

	onDestroy(() => contactImport.destroy());
</script>

<ImportModal />
