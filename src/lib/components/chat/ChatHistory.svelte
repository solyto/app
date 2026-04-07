<script lang="ts">
	import { slide } from 'svelte/transition';
	import { getAssistants } from '$lib/state/Assistants.svelte';
	import { markdownToHtml } from '$lib/helpers/FormatHelper';
	import { nl2br } from '$lib/helpers/FormatHelper.js';
	import DOMPurify from 'dompurify';
	import IconBot from '@lucide/svelte/icons/bot';
	import IconUser from '@lucide/svelte/icons/user';
	import { tick } from 'svelte';

	let { responding = false } = $props<{ responding?: boolean }>();

	const assistants = getAssistants();

	let chatContainer = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (assistants.chatHistory.length) {
			tick().then(() => {
				chatContainer?.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
			});
		}
	});
</script>

{#if assistants.loaded}
	<div class="flex flex-col gap-4" bind:this={chatContainer}>
		{#each assistants.chatHistory as message (message.id)}
			<div
				class="flex gap-3 {message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}"
				in:slide={{ duration: 200 }}
			>
				<div class="flex flex-shrink-0 items-start pt-1">
					{#if message.role === 'user'}
						<div
							class="flex size-8 items-center justify-center rounded-full bg-c-heading/10 dark:bg-c-heading/30"
						>
							<IconUser class="size-4 text-c-heading dark:text-c-primary" />
						</div>
					{:else}
						<div
							class="flex size-8 items-center justify-center rounded-full bg-c-primary/10 dark:bg-c-primary/20"
						>
							<IconBot class="size-4 text-c-primary" />
						</div>
					{/if}
				</div>
				<div
					class="markdown max-w-[75%] px-4 py-3 text-sm leading-relaxed {message.role ===
					'user'
						? 'rounded-2xl rounded-tr-sm bg-c-primary text-white'
						: 'rounded-2xl rounded-tl-sm border border-c-neutral-1 bg-c-neutral text-c-neutral-7 dark:border-s-dark-3 dark:bg-s-dark-3 dark:text-c-neutral-2'}"
				>
					{@html DOMPurify.sanitize(markdownToHtml(nl2br(message.content)))}
				</div>
			</div>
		{/each}

		{#if responding}
			<div class="flex flex-row gap-3" in:slide={{ duration: 200 }}>
				<div class="flex flex-shrink-0 items-start pt-1">
					<div
						class="flex size-8 items-center justify-center rounded-full bg-c-primary/10 dark:bg-c-primary/20"
					>
						<IconBot class="size-4 text-c-primary" />
					</div>
				</div>
				<div
					class="rounded-2xl rounded-tl-sm border border-c-neutral-1 bg-c-neutral px-5 py-4 dark:border-s-dark-3 dark:bg-s-dark-3"
				>
					<div class="flex gap-1.5">
						<span
							class="size-2 animate-bounce rounded-full bg-c-neutral-4 dark:bg-c-neutral-5"
							style="animation-delay: 0ms;"
						></span>
						<span
							class="size-2 animate-bounce rounded-full bg-c-neutral-4 dark:bg-c-neutral-5"
							style="animation-delay: 150ms;"
						></span>
						<span
							class="size-2 animate-bounce rounded-full bg-c-neutral-4 dark:bg-c-neutral-5"
							style="animation-delay: 300ms;"
						></span>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
