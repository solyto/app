<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getTags } from '$lib/state/Tags.svelte.js';
	import type { CreateQuoteRequest, Quote, UpdateQuoteRequest } from '$lib/types/library_quote';
	import MultiSelect from '$lib/components/forms/MultiSelect.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import CreateModal from '$lib/components/libraries/shared/CreateModal.svelte';
	import { getQuoteLibrary } from '$lib/state/QuoteLibrary.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';

	const ts = getTranslation();
	const library = getQuoteLibrary();
	const tags = getTags();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let activeEntry = $state<Quote | null>(library.activeEntry);

	let summaryValue = $state<string>(activeEntry ? activeEntry.summary : '');
	let authorValue = $state<string>(activeEntry ? activeEntry.author : '');
	let sourceValue = $state<string>(activeEntry ? activeEntry.source : '');
	let quoteValue = $state<string>(activeEntry ? activeEntry.quote : '');
	let selectedTags = $state(
		activeEntry ? activeEntry.tags.map((tag) => ({ label: tag.name, value: tag.id })) : []
	);

	const tagOptions: { label: string; value: string }[] = tags.tags.map((tag) => ({
		label: tag.name,
		value: tag.id.toString()
	}));

	async function onsubmit(): Promise<void> {
		if (activeEntry) {
			return await update();
		} else {
			return await create();
		}
	}

	async function create(): Promise<void> {
		loadingIndicator.start();

		const request: CreateQuoteRequest = {
			author: authorValue !== '' ? authorValue : null,
			summary: summaryValue !== '' ? summaryValue : null,
			source: sourceValue !== '' ? sourceValue : null,
			quote: quoteValue,
			tags: selectedTags.length > 0 ? selectedTags.map((tag) => tag.value) : null
		};
		const ok = await library.create(request);
		if (ok) {
			authorValue = '';
			summaryValue = '';
			quoteValue = '';
			sourceValue = '';
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.quotes.create_error);
		}

		loadingIndicator.stop();
	}

	async function update(): Promise<void> {
		loadingIndicator.start();

		const request: UpdateQuoteRequest = {
			author: authorValue !== '' ? authorValue : null,
			summary: summaryValue !== '' ? summaryValue : null,
			source: sourceValue !== '' ? sourceValue : null,
			quote: quoteValue !== '' ? quoteValue : null,
			tags: selectedTags.length > 0 ? selectedTags.map((tag) => tag.value) : null
		};
		const ok = await library.update(activeEntry, request);
		if (ok) {
			library.closeCreateModal();
			await library.load();
		} else {
			notifications.error(ts.get.libraries.quotes.update_error);
		}

		loadingIndicator.stop();
	}
</script>

<CreateModal
	title={activeEntry !== null
		? ts.get.libraries.quotes.edit_quote
		: ts.get.libraries.quotes.add_quote}
	{library}
>
	<ModalFormRow label={ts.get.libraries.quotes.author}>
		<TextInput bind:value={authorValue} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.quotes.quote}>
		<TextInput bind:value={quoteValue} multiLine={true} height={150} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.tags}>
		<MultiSelect bind:value={selectedTags} options={tagOptions} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.quotes.summary}>
		<TextInput bind:value={summaryValue} multiLine={true} height={80} />
	</ModalFormRow>
	<ModalFormRow label={ts.get.libraries.quotes.source}>
		<TextInput bind:value={sourceValue} />
	</ModalFormRow>
	<div class="mt-8 flex w-full flex-row items-center justify-end">
		<Button title={ts.get.layout.save} onclick={onsubmit} />
	</div>
</CreateModal>
