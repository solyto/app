<script lang="ts">
	import { page } from '$app/state';
	import { getAssistants } from '$lib/state/Assistants.svelte.js';
	import { onDestroy, onMount, tick } from 'svelte';
	import type { UpdateAssistantRequest } from '$lib/types/assistant';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import ChatHistory from '$lib/components/chat/ChatHistory.svelte';
	import { getKeyManager } from '$lib/KeyManager.svelte.js';
	import EditAssistant from '$lib/components/assistants/EditAssistant.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { goto } from '$app/navigation';
	import { urls } from '$lib/config/urls';
	import { resolve } from '$app/paths';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import InlineEditButton from '$lib/components/ui/buttons/InlineEditButton.svelte';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';
	import IconBot from '@lucide/svelte/icons/bot';
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconSend from '@lucide/svelte/icons/send-horizontal';
	import IconLoader from '@lucide/svelte/icons/loader';
	import { fade } from 'svelte/transition';

	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const keyManager = getKeyManager();
	const assistants = getAssistants();

	let messageInput = $state<HTMLTextAreaElement | null>(null);
	let messageValue = $state<string>('');
	let editModal = $state<boolean>(false);
	let deleteModal = $state<boolean>(false);
	let keyHandlers = $state<{ [key: string]: string | null }>({ Enter: null });
	let responding = $state<boolean>(false);

	onMount(async () => {
		if (page.params.id) {
			loadingIndicator.start();
			await assistants.load();
			assistants.changeActiveAssistant(assistants.getAssistant(page.params.id));
			assistants.chatHistory = await assistants.getChatHistory();
			loadingIndicator.stop();
		}

		await tick();
		messageInput?.focus();

		keyHandlers.Enter = keyManager.registerKeyDown('Enter', chat);
	});

	onDestroy(() => {
		keyManager.unregisterKeyDown(keyHandlers.Enter);
		assistants.activeAssistant = null;
		assistants.chatHistory = [];
	});

	function toggleEditModal(): void {
		editModal = !editModal;

		if (editModal) {
			keyManager.unregisterKeyDown(keyHandlers.Enter);
		} else {
			keyHandlers.Enter = keyManager.registerKeyDown('Enter', chat);
		}
	}

	function toggleDeleteModal(): void {
		deleteModal = !deleteModal;

		if (editModal) {
			keyManager.unregisterKeyDown(keyHandlers.Enter);
		} else {
			keyHandlers.Enter = keyManager.registerKeyDown('Enter', chat);
		}
	}

	async function chat(): Promise<void> {
		if (responding || messageValue.trim() === '') return;

		loadingIndicator.start();
		responding = true;
		const messageRequest = messageValue;
		messageValue = '';
		await assistants.chat(messageRequest);
		responding = false;
		loadingIndicator.stop();
	}

	async function onEdit(id: string, request: UpdateAssistantRequest): Promise<void> {
		loadingIndicator.start();
		await assistants.update(id, request);
		loadingIndicator.stop();

		toggleEditModal();
	}

	async function onDelete(id: string): Promise<void> {
		loadingIndicator.start();
		const res = await assistants.delete(id);
		loadingIndicator.stop();

		if (res) await goto(resolve(urls.assistants));
	}
</script>

<div class="flex h-full flex-col">
	{#if editModal}
		<EditAssistant assistant={assistants.activeAssistant} {onEdit} onClose={toggleEditModal} />
	{/if}
	{#if deleteModal}
		<Modal
			title={ts.get.assistants.deletion_title}
			description={ts.get.assistants.deletion_description}
			type="confirm"
			onConfirm={() => onDelete(assistants.activeAssistant.id)}
			onCancel={toggleDeleteModal}
		/>
	{/if}
	{#if assistants.loaded && assistants.activeAssistant}
		<div
			class="flex-shrink-0 border-b border-c-neutral-1 bg-white/80 px-4 py-4 backdrop-blur-sm lg:px-8 dark:border-s-dark-3 dark:bg-s-dark/80"
		>
			<div class="flex w-full flex-row items-center justify-between" in:fade>
				<div class="flex flex-row items-center gap-4">
					<a
						href={resolve(urls.assistants)}
						class="flex size-9 items-center justify-center rounded-lg text-c-neutral-4 transition-all hover:bg-c-neutral-1 hover:text-c-neutral-6 dark:hover:bg-s-dark-3 dark:hover:text-white"
					>
						<IconArrowLeft class="size-5" />
					</a>
					<div
						class="flex size-10 items-center justify-center rounded-xl bg-c-primary/10 dark:bg-c-primary/20"
					>
						<IconBot class="size-5 text-c-primary" />
					</div>
					<div class="flex flex-col">
						<span class="text-lg font-bold text-c-heading dark:text-c-primary">
							{assistants.activeAssistant.title}
						</span>
						{#if assistants.activeAssistant.description}
							<span class="text-xs text-c-neutral-5 dark:text-c-neutral-4">
								{assistants.activeAssistant.description}
							</span>
						{/if}
					</div>
				</div>
				<div class="flex flex-row gap-2">
					<InlineEditButton onClick={toggleEditModal} />
					<InlineDeleteButton onClick={toggleDeleteModal} />
				</div>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto px-4 py-4 lg:px-8">
			<ChatHistory {responding} />
		</div>

		<div
			class="flex-shrink-0 border-t border-c-neutral-1 bg-white/80 px-4 py-4 backdrop-blur-sm lg:px-8 dark:border-s-dark-3 dark:bg-s-dark/80"
		>
			<div class="flex flex-row items-end gap-3">
				<textarea
					bind:this={messageInput}
					bind:value={messageValue}
					placeholder={ts.get.assistants.chat_placeholder}
					rows="1"
					class="flex-1 resize-none rounded-xl border border-c-neutral-2 px-4 py-3 text-sm shadow-sm transition-all focus:ring-2 focus:ring-c-primary/50 focus:outline-none dark:border-s-dark-3 dark:bg-s-dark-2 dark:text-white"
				></textarea>
				<button
					class="flex size-11 cursor-pointer items-center justify-center rounded-xl transition-all {messageValue.trim() &&
					!responding
						? 'bg-c-primary text-white shadow-sm hover:bg-c-primary/85'
						: 'bg-c-neutral-1 text-c-neutral-4 dark:bg-s-dark-3'}"
					onclick={chat}
					disabled={responding || messageValue.trim() === ''}
				>
					{#if responding}
						<IconLoader class="size-5 animate-spin" />
					{:else}
						<IconSend class="size-5" />
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>
