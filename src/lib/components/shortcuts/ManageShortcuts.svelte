<script lang="ts">
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getShortcuts } from '$lib/state/Shortcuts.svelte.js';
	import type { CreateShortcutRequest } from '$lib/types/shortcut.js';
	import ShotcutEdit from '$lib/components/shortcuts/ShortcutEdit.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import SaveButton from '$lib/components/ui/buttons/SaveButton.svelte';
	import AddButton from '$lib/components/ui/buttons/AddButton.svelte';

	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const shortcuts = getShortcuts();

	let { onClose } = $props<{ onClose: () => void }>();

	let create = $state<boolean>(false);
	let titleValue = $state<string>('');
	let urlValue = $state<string>('');

	async function onCreate() {
		if (titleValue === '' || urlValue === '') {
			return;
		}

		loadingIndicator.start();
		const request: CreateShortcutRequest = {
			title: titleValue,
			url: urlValue
		};
		await shortcuts.create(request);
		loadingIndicator.stop();
		toggleCreate();
	}

	function toggleCreate() {
		create = !create;
	}
</script>

<ContentModal title={ts.get.widgets.manage_shortcuts} rounded="2xl" p="4" {onClose}>
	<div class="flex w-full flex-col gap-2">
		{#each shortcuts.shortcuts as shortcut (shortcut.id)}
			<ShotcutEdit {shortcut} />
		{/each}
		<div class="mt-4 flex w-full justify-center">
			{#if create}
				<div class="flex w-full items-center gap-2">
					<TextInput
						bind:value={titleValue}
						placeholder={ts.get.widgets.shortcut_title}
					/>
					<TextInput bind:value={urlValue} placeholder={ts.get.widgets.shortcut_url} />
					<SaveButton
						onClick={() => {
							onCreate();
						}}
					/>
				</div>
			{:else}
				<AddButton
					onClick={() => {
						toggleCreate();
					}}
				/>
			{/if}
		</div>
	</div>
</ContentModal>
