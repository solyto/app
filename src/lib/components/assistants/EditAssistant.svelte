<script lang="ts">
	import type {
		Assistant,
		CreateAssistantRequest,
		UpdateAssistantRequest
	} from '$lib/types/assistant';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import IconBot from '@lucide/svelte/icons/bot';

	let {
		onClose,
		onCreate = null,
		onEdit = null,
		assistant = null
	} = $props<{
		onClose: () => void;
		onCreate?: (request: CreateAssistantRequest) => Promise<void>;
		onEdit?: (request: UpdateAssistantRequest) => Promise<void>;
		assistant?: Assistant | null;
	}>();

	const ts = getTranslation();
	const isEditing = assistant !== null;

	let titleInput = $state<HTMLInputElement | null>(null);
	let titleValue = $state<string>(assistant?.title ?? '');
	let descriptionInput = $state<HTMLInputElement | null>(null);
	let descriptionValue = $state<string>(assistant?.description ?? '');
	let promptInput = $state<HTMLTextAreaElement | null>(null);
	let promptValue = $state<string>(assistant?.prompt ?? '');

	async function onSave(): Promise<void> {
		if (titleValue === '' || descriptionValue === '' || promptValue === '') return;

		const request = {
			title: titleValue,
			description: descriptionValue,
			prompt: promptValue
		};

		if (isEditing) {
			await onEdit(assistant.id, request);
		} else {
			await onCreate(request);
		}
	}
</script>

<ContentModal rounded="lg" {onClose}>
	<div class="flex w-full flex-col gap-5 p-6">
		<div class="flex items-center gap-3 pb-2">
			<div
				class="flex size-10 items-center justify-center rounded-xl bg-c-primary/10 dark:bg-c-primary/20"
			>
				<IconBot class="size-5 text-c-primary" />
			</div>
			<h2 class="text-lg font-bold text-c-heading dark:text-c-primary">
				{isEditing ? ts.get.assistants.update : ts.get.assistants.create}
			</h2>
		</div>
		<div class="flex flex-col gap-1">
			<label class="pl-1 text-xs font-medium text-c-neutral-5 dark:text-c-neutral-4"
				>{ts.get.assistants.title}</label
			>
			<TextInput
				bind:input={titleInput}
				bind:value={titleValue}
				placeholder={ts.get.assistants.title}
			/>
		</div>
		<div class="flex flex-col gap-1">
			<label class="pl-1 text-xs font-medium text-c-neutral-5 dark:text-c-neutral-4"
				>{ts.get.assistants.description}</label
			>
			<TextInput
				bind:input={descriptionInput}
				bind:value={descriptionValue}
				placeholder={ts.get.assistants.description}
			/>
		</div>
		<div class="flex flex-col gap-1">
			<label class="pl-1 text-xs font-medium text-c-neutral-5 dark:text-c-neutral-4"
				>{ts.get.assistants.prompt}</label
			>
			<TextInput
				bind:input={promptInput}
				bind:value={promptValue}
				placeholder={ts.get.assistants.prompt}
				multiLine={true}
				height={300}
			/>
		</div>
		<Button
			title={isEditing ? ts.get.assistants.update : ts.get.assistants.create}
			onclick={onSave}
		/>
	</div>
</ContentModal>
