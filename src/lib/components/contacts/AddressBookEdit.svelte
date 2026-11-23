<script lang="ts">
	import ColorPicker from 'svelte-awesome-color-picker';
	import ColorPickerInput from '$lib/components/forms/ColorPickerInput.svelte';
	import IconEye from '$lib/icons/lucide/eye.svelte';
	import IconEyeOff from '$lib/icons/lucide/eye-off.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { clickOutside } from '$lib/helpers/ClickHelper';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';
	import type { AddressBook, UpdateAddressBookRequest } from '$lib/types/contact';
	import { getContacts } from '$lib/state/Contacts.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';

	const contacts = getContacts();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();

	let { addressBook }: { addressBook: AddressBook } = $props();

	let hex = $state<string>(addressBook.color ?? 'var(--color-c-neutral-2)');

	async function onColorChange(): Promise<void> {
		if (hex === addressBook.color) return;
		if (hex === null) return;

		const request: UpdateAddressBookRequest = { color: hex };
		loadingIndicator.start();
		try {
			await contacts.updateAddressBook(addressBook, request);
		} finally {
			loadingIndicator.stop();
		}
	}

	function toggleHidden(): void {
		contacts.toggleAddressBook(addressBook.id);
	}

	function onDelete(): void {
		contacts.activeAddressBook = addressBook;
		contacts.deleteModal = true;
	}
</script>

<div class="flex items-center gap-4">
	<div use:clickOutside={onColorChange}>
		<ColorPicker
			components={{ input: ColorPickerInput }}
			isAlpha={false}
			bind:hex
			position="responsive"
			nullable={false}
			label=""
			isTextInput={false}
			--cp-border-color="var(--color-c-neutral-2)"
		/>
	</div>
	<span class="min-w-0 flex-1">{addressBook.name}</span>
	<div class="flex items-center gap-1">
		<button
			type="button"
			class="group relative flex size-[34px] cursor-pointer items-center justify-center rounded-full drop-shadow-md transition-all hover:drop-shadow-xl"
			class:text-c-primary={!contacts.isAddressBookHidden(addressBook.id)}
			class:text-c-neutral-3={contacts.isAddressBookHidden(addressBook.id)}
			title={ts.get.layout.toggle}
			aria-label={ts.get.layout.toggle}
			onclick={toggleHidden}
		>
			<span class="absolute inset-0 rounded-full bg-c-primary opacity-0 transition-all group-hover:opacity-100 group-focus-visible:opacity-100"></span>
			{#if contacts.isAddressBookHidden(addressBook.id)}
				<IconEyeOff class="relative size-5 group-hover:text-white group-focus-visible:text-white" />
			{:else}
				<IconEye class="relative size-5 group-hover:text-white group-focus-visible:text-white" />
			{/if}
		</button>
		<InlineDeleteButton onClick={onDelete} />
	</div>
</div>
