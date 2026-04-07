<script lang="ts">
	import { getAssistants } from '$lib/state/Assistants.svelte.js';
	import { urls } from '$lib/config/urls';
	import { resolve } from '$app/paths';
	import EditAssistant from '$lib/components/assistants/EditAssistant.svelte';
	import type { CreateAssistantRequest } from '$lib/types/assistant';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import IconBot from '@lucide/svelte/icons/bot';
	import IconPlus from '@lucide/svelte/icons/plus';
	import IconMessageSquare from '@lucide/svelte/icons/message-square';
	import { fade } from 'svelte/transition';

	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const assistants = getAssistants();

	let createModal = $state<boolean>(false);

	async function onCreate(request: CreateAssistantRequest): Promise<void> {
		loadingIndicator.start();
		await assistants.create(request);
		loadingIndicator.stop();
		createModal = false;
	}
</script>

<div class="flex w-full flex-col gap-6 p-4 lg:p-8">
	{#if createModal}
		<EditAssistant
			{onCreate}
			onClose={() => {
				createModal = false;
			}}
		/>
	{/if}

	<div class="flex w-full flex-row items-center justify-between">
		<div class="flex flex-row items-center gap-3">
			<div
				class="flex size-10 items-center justify-center rounded-xl bg-c-primary/10 dark:bg-c-primary/20"
			>
				<IconBot class="size-5 text-c-primary" />
			</div>
			<h1 class="text-2xl font-bold text-c-heading dark:text-c-primary">
				{ts.get.nav.assistants}
			</h1>
		</div>
		<button
			class="flex cursor-pointer items-center gap-2 rounded-lg bg-c-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-c-primary/85 hover:shadow-md"
			onclick={() => {
				createModal = true;
			}}
		>
			<IconPlus class="size-4" />
			{ts.get.assistants.add}
		</button>
	</div>

	{#if assistants.loaded && assistants.assistants.length === 0}
		<div class="flex w-full flex-col items-center justify-center gap-4 py-16" in:fade>
			<div
				class="flex size-16 items-center justify-center rounded-2xl bg-c-neutral-1 dark:bg-s-dark-3"
			>
				<IconMessageSquare class="size-8 text-c-neutral-3 dark:text-c-neutral-5" />
			</div>
			<p class="text-center text-c-neutral-5 dark:text-c-neutral-4">
				{ts.get.assistants.no_assistants}
			</p>
			<button
				class="flex cursor-pointer items-center gap-2 rounded-lg bg-c-primary px-4 py-2 text-sm text-white transition-all hover:bg-c-primary/85"
				onclick={() => {
					createModal = true;
				}}
			>
				<IconPlus class="size-4" />
				{ts.get.assistants.add}
			</button>
		</div>
	{:else if assistants.loaded}
		<div class="flex w-full flex-col flex-wrap gap-4 md:flex-row">
			{#each assistants.assistants as assistant, i (assistant.id)}
				<a
					href={resolve(urls.assistant, { id: assistant.id })}
					class="group relative w-full rounded-xl border border-c-neutral-1 bg-white p-5 shadow-sm transition-all hover:border-c-primary/30 hover:shadow-md md:w-80 dark:border-s-dark-3 dark:bg-s-dark-2 dark:shadow-s-dark-shadow dark:hover:border-c-primary/30"
					in:fade={{ delay: i * 50, duration: 200 }}
				>
					<div class="flex flex-row items-start gap-4">
						<div
							class="flex size-11 flex-shrink-0 items-center justify-center rounded-xl bg-c-primary/10 transition-all group-hover:bg-c-primary/20 dark:bg-c-primary/20 dark:group-hover:bg-c-primary/30"
						>
							<IconBot class="size-5 text-c-primary" />
						</div>
						<div class="flex min-w-0 flex-col gap-1">
							<span class="truncate font-semibold text-c-neutral-8 dark:text-white">
								{assistant.title}
							</span>
							{#if assistant.description}
								<span class="line-clamp-2 text-sm text-c-neutral-5 dark:text-c-neutral-4">
									{assistant.description}
								</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
