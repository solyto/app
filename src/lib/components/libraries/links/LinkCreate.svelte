<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import type { CreateLinkRequest } from '$lib/types/library_link';
	import { getTags } from '$lib/state/Tags.svelte.js';
	import MultiSelect from '$lib/components/forms/MultiSelect.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import CreateModal from '$lib/components/libraries/shared/CreateModal.svelte';
	import { getLinkLibrary } from '$lib/state/LinkLibrary.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';

	const ts = getTranslation();
	const library = getLinkLibrary();
	const tags = getTags();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let titleValue = $state<string>('');
	let urlValue = $state<string>('');
	let selectedTags = $state([]);

	const tagOptions: { label: string; value: string }[] = tags.tags.map((tag) => ({
		label: tag.name,
		value: tag.id.toString()
	}));

	async function onsubmit(): Promise<void> {
		loadingIndicator.start();

		const request: CreateLinkRequest = {
			title: titleValue,
			url: urlValue,
			tags: selectedTags.length > 0 ? selectedTags.map((tag) => tag.value) : null
		};
		const ok = await library.create(request);
		if (ok) {
			titleValue = '';
			urlValue = '';
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.links.create_error);
		}

		loadingIndicator.stop();
	}
</script>

<CreateModal title={ts.get.libraries.links.add_link} {library}>
	<ModalFormRow label={ts.get.libraries.links.title}>
		<TextInput bind:value={titleValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.links.url}>
		<TextInput bind:value={urlValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.tags}>
		<MultiSelect bind:value={selectedTags} options={tagOptions} />
	</ModalFormRow>
	<div class="mt-8 flex w-full flex-row items-center justify-end">
		<Button title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
