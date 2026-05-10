<script lang="ts">
	import { fade, blur, scale } from 'svelte/transition';
	import { getQuickAdd } from '$lib/state/QuickAdd.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getKeyManager } from '$lib/KeyManager.svelte';
	import { onDestroy, onMount } from 'svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import IconLink from '@lucide/svelte/icons/link';
	import IconX from '@lucide/svelte/icons/x';
	import {
		CONTENT_TYPE_LABELS,
		type QuickAddContentType
	} from '$lib/types/quick_add';

	const quickAdd = getQuickAdd();
	const ts = getTranslation();
	const keyManager = getKeyManager();

	let keyHandlers = $state<{ [key: string]: string | null }>({ Escape: null });
	let urlInput: HTMLInputElement | undefined = $state();

	const ALL_TYPES: QuickAddContentType[] = [
		'links',
		'books',
		'movies',
		'music',
		'games',
		'recipes',
		'plants',
		'quotes',
		'feed',
		'todo',
		'note'
	];

	onMount(() => {
		keyHandlers.Escape = keyManager.registerKeyDown('Escape', () => quickAdd.closeModal());
		setTimeout(() => urlInput?.focus(), 100);
	});

	onDestroy(() => keyManager.unregisterAll(keyHandlers));

	function handleSubmit(): void {
		quickAdd.detect();
	}
</script>

{#if quickAdd.open}
	<div
		class="fixed top-0 left-0 z-50 flex h-dvh w-screen items-center justify-center bg-transparent backdrop-blur-xs modal-blur"
		out:fade
		in:blur={{ duration: 300 }}
	>
		<div class="relative my-auto p-8 max-md:p-0 modal-container" in:scale={{ start: 0.75 }}>
			<div
				class="w-full max-w-lg rounded-2xl border-1 border-c-neutral-2 bg-c-bg-modal p-6 shadow-md dark:border-s-dark dark:shadow-s-dark-shadow max-md:w-screen"
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-bold text-c-heading dark:text-c-primary">
						{ts.get.quick_add.title}
					</h2>
					<button
						class="cursor-pointer text-c-neutral-5 hover:text-c-heading dark:hover:text-c-primary"
						onclick={() => quickAdd.closeModal()}
					>
						<IconX class="h-5 w-5" />
					</button>
				</div>

				{#if quickAdd.showTypeSelector}
					<div class="space-y-3">
						<p class="text-sm text-c-neutral-5">{ts.get.quick_add.select_type}</p>
						<div class="grid grid-cols-2 gap-2">
							{#each ALL_TYPES as type}
								<button
									class="cursor-pointer rounded-lg border-1 border-c-neutral-2 bg-c-neutral-1 px-3 py-2 text-sm font-medium text-c-heading transition-all hover:border-c-action hover:bg-c-action hover:text-white dark:border-s-dark-3 dark:text-c-primary dark:hover:border-c-action"
									onclick={() => quickAdd.selectType(type)}
								>
									{CONTENT_TYPE_LABELS[type]}
								</button>
							{/each}
						</div>
					</div>
				{:else if quickAdd.needsConfirmation && quickAdd.detectedType}
					<div class="space-y-4">
						<p class="text-sm text-c-neutral-5">
							{ts.get.quick_add.detected_as
								.replace('%s', CONTENT_TYPE_LABELS[quickAdd.detectedType])
								.replace('%d', Math.round(quickAdd.confidence * 100).toString())}
						</p>
						<div class="flex gap-3">
							<Button
								title={ts.get.quick_add.confirm}
								type="action"
								onclick={() => quickAdd.confirm(quickAdd.detectedType!)}
								disabled={quickAdd.loading}
							/>
							<Button
								title={ts.get.quick_add.choose_different}
								type="slight"
								onclick={() => quickAdd.rejectDetection()}
								disabled={quickAdd.loading}
							/>
						</div>
					</div>
				{:else}
					<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
						<div class="flex gap-2">
							<div
								class="flex flex-1 items-center gap-2 rounded-lg border-1 border-c-neutral-2 bg-c-neutral-1 px-3 py-2 dark:border-s-dark-3"
							>
								<IconLink class="h-4 w-4 shrink-0 text-c-neutral-5" />
								<input
									bind:this={urlInput}
									bind:value={quickAdd.url}
									type="url"
									placeholder={ts.get.quick_add.placeholder}
									class="w-full bg-transparent text-sm text-c-heading outline-none dark:text-c-primary"
									disabled={quickAdd.loading}
								/>
							</div>
							<Button
								title={quickAdd.loading ? ts.get.quick_add.detect : ts.get.quick_add.detect}
								type="action"
								onclick={handleSubmit}
								disabled={quickAdd.loading || !quickAdd.url.trim()}
								class={quickAdd.loading ? 'animate-pulse' : ''}
							/>
						</div>
					</form>
				{/if}

				{#if quickAdd.error}
					<p class="mt-3 text-sm text-c-danger">{quickAdd.error}</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
