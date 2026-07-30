<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import type { CreateVideoRequest } from '$lib/types/library_video';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import CreateModal from '$lib/components/libraries/shared/CreateModal.svelte';
	import { getVideoLibrary } from '$lib/state/VideoLibrary.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';

	const ts = getTranslation();
	const library = getVideoLibrary();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let titleValue = $state<string>('');
	let urlValue = $state<string>('');
	let coverValue = $state<string>('');

	async function onsubmit(): Promise<void> {
		loadingIndicator.start();

		const request: CreateVideoRequest = {
			title: titleValue || null,
			url: urlValue,
			cover_path: coverValue !== '' ? coverValue : null,
			category_id: null
		};
		const ok = await library.create(request);
		if (ok) {
			titleValue = '';
			urlValue = '';
			coverValue = '';
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.videos.create_error);
		}

		loadingIndicator.stop();
	}
</script>

<CreateModal title={ts.get.libraries.videos.add_video} {library} newCover={coverValue}>
	<ModalFormRow label={ts.get.libraries.videos.url}>
		<TextInput bind:value={urlValue} placeholder="https://www.youtube.com/watch?v=..." />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.videos.title}>
		<TextInput bind:value={titleValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.videos.cover}>
		<TextInput bind:value={coverValue} placeholder="https://" />
	</ModalFormRow>
	<div class="mt-8 flex w-full flex-row items-center justify-end">
		<TextButton title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
