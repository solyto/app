<script lang="ts">
	import ColorPicker from 'svelte-awesome-color-picker';
	import ColorPickerInput from '$lib/components/forms/ColorPickerInput.svelte';
	import FileUpload from '$lib/components/forms/FileUpload.svelte';
	import SegmentedControl from '$lib/components/forms/SegmentedControl.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import ContactImportService from '$lib/services/ContactImportService';
	import type { AddressBook, ImportFileTarget } from '$lib/types/contact';

	let { targets, busy, onsubmit }: {
		targets: AddressBook[];
		busy: boolean;
		onsubmit: (file: File, target: ImportFileTarget) => void;
	} = $props();

	const DEFAULT_COLOR = '#0088CC';

	const ts = getTranslation();
	const service = new ContactImportService();
	const uid = $props.id();

	let file = $state<File | null>(null);
	let targetType = $state<ImportFileTarget['type']>('new');
	let name = $state<string>('');
	let hex = $state<string>(DEFAULT_COLOR);
	let addressBookId = $state<string>(targets[0]?.id.toString() ?? '');

	const targetOptions = [
		{ label: ts.get.contacts.import_target_new, value: 'new' },
		{ label: ts.get.contacts.import_target_existing, value: 'existing' }
	];

	async function pick(picked: File): Promise<boolean> {
		if (file === null || name === service.defaultAddressBookName(file.name)) name = service.defaultAddressBookName(picked.name);
		file = picked;
		return true;
	}

	function addressBookOptions(): { label: string; value: string }[] {
		return targets.map((addressBook) => ({ label: addressBook.name, value: addressBook.id.toString() }));
	}

	function changeTarget(value: string): void {
		targetType = value === 'existing' ? 'existing' : 'new';
	}

	function target(): ImportFileTarget {
		if (targetType === 'existing') return { type: 'existing', addressBookId: Number(addressBookId) };
		return { type: 'new', name, color: hex };
	}

	function canSubmit(): boolean {
		return !busy && file !== null && (targetType === 'new' || addressBookId !== '');
	}

	function submit(): void {
		if (file !== null && canSubmit()) onsubmit(file, target());
	}
</script>

<div class="flex flex-col gap-3">
	<FileUpload accept=".vcf,.vcard,text/vcard,text/x-vcard" onfile={pick} />
	{#if targets.length > 0}
		<SegmentedControl value={targetType} options={targetOptions} onchange={changeTarget} />
	{/if}
	{#if targetType === 'new'}
		<ModalFormRow label={ts.get.layout.name} labelFor="{uid}-name">
			<div class="flex items-center gap-2">
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
				<TextInput bind:value={name} id="{uid}-name" maxlength={100} />
			</div>
		</ModalFormRow>
	{:else}
		<ModalFormRow label={ts.get.contacts.import_address_book}>
			<Select bind:value={addressBookId} options={addressBookOptions()} ariaLabel={ts.get.contacts.import_address_book} />
		</ModalFormRow>
	{/if}
	<TextButton type="primary" title={ts.get.contacts.import} disabled={!canSubmit()} onclick={submit} class="mt-2" />
</div>
