<script lang="ts">
	import { getContacts } from '$lib/state/Contacts.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import Search from '$lib/components/contacts/Search.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';

	const contacts = getContacts();
	const ts = getTranslation();
</script>

<div class="relative flex w-full items-center justify-end gap-4 text-right">
	<Search />
	<Button title={ts.get.contacts.add_contact} onclick={() => contacts.openCreateModal()} />
</div>
