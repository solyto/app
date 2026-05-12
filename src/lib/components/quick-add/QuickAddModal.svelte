<script lang="ts">
	import { getQuickAdd } from '$lib/state/QuickAdd.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getKeyManager } from '$lib/KeyManager.svelte';
	import { onDestroy, onMount, tick } from 'svelte';
	import IconLink from '@lucide/svelte/icons/link';
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import IconBookOpen from '@lucide/svelte/icons/book-open';
	import IconFilm from '@lucide/svelte/icons/film';
	import IconMusic from '@lucide/svelte/icons/music';
	import IconGamepad from '@lucide/svelte/icons/gamepad-2';
	import IconChefHat from '@lucide/svelte/icons/chef-hat';
	import IconLeaf from '@lucide/svelte/icons/leaf';
	import IconQuote from '@lucide/svelte/icons/quote';
	import IconListTodo from '@lucide/svelte/icons/list-todo';
	import IconNotebookPen from '@lucide/svelte/icons/notebook-pen';
	import IconRss from '@lucide/svelte/icons/rss';
	import { CONTENT_TYPE_LABELS, type QuickAddContentType } from '$lib/types/quick_add';

	const quickAdd = getQuickAdd();
	const ts = getTranslation();
	const keyManager = getKeyManager();

	let keyHandlers = $state<{ [key: string]: string | null }>({
		Escape: null, Enter: null, ArrowRight: null, ArrowLeft: null, ArrowDown: null, ArrowUp: null
	});

	let urlInput: HTMLInputElement | null = $state(null);
	let focusedTypeIndex = $state(0);

	const TYPE_ICONS = {
		links: IconLink,
		books: IconBookOpen,
		movies: IconFilm,
		music: IconMusic,
		games: IconGamepad,
		recipes: IconChefHat,
		plants: IconLeaf,
		quotes: IconQuote,
		todo: IconListTodo,
		note: IconNotebookPen,
		feed: IconRss
	} as const;

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

	onMount(async () => {
		keyHandlers.Escape = keyManager.registerKeyDown('Escape', () => quickAdd.closeModal(), { priority: 0 });
		keyHandlers.Enter = keyManager.registerKeyDown('Enter', handleEnter, { priority: 0 });
		keyHandlers.ArrowRight = keyManager.registerKeyDown('ArrowRight', () => navigateTypes(1), { priority: 0 });
		keyHandlers.ArrowLeft = keyManager.registerKeyDown('ArrowLeft', handleArrowLeft, { priority: 0 });
		keyHandlers.ArrowDown = keyManager.registerKeyDown('ArrowDown', () => navigateTypes(3), { priority: 0 });
		keyHandlers.ArrowUp = keyManager.registerKeyDown('ArrowUp', () => navigateTypes(-3), { priority: 0 });
		setTimeout(async () => {
			await tick();
			urlInput?.focus();
		}, 350);
	});

	onDestroy(() => keyManager.unregisterAll(keyHandlers));

	function handleSubmit(): void {
		if (!quickAdd.url.trim() || quickAdd.loading) return;
		quickAdd.detect();
	}

	function handleEnter(): void {
		if (quickAdd.loading) return;
		if (quickAdd.showTypeSelector) {
			quickAdd.selectType(ALL_TYPES[focusedTypeIndex]);
			return;
		}
		if (quickAdd.needsConfirmation && quickAdd.detectedType) {
			quickAdd.confirm(quickAdd.detectedType);
		} else if (!quickAdd.needsConfirmation) {
			handleSubmit();
		}
	}

	function handleArrowLeft(): void {
		if (quickAdd.needsConfirmation) {
			enterTypeSelector();
		} else {
			navigateTypes(-1);
		}
	}

	function navigateTypes(delta: number): void {
		if (!quickAdd.showTypeSelector) return;
		focusedTypeIndex = Math.max(0, Math.min(ALL_TYPES.length - 1, focusedTypeIndex + delta));
	}

	function enterTypeSelector(): void {
		focusedTypeIndex = 0;
		quickAdd.rejectDetection();
	}

	function confidencePercent(): number {
		return Math.round(quickAdd.confidence * 100);
	}

	function metadataEntries(): [string, string][] {
		const m = quickAdd.metadata;
		if (!m) return [];
		return Object.entries(m).filter(
			(entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0
		);
	}
</script>

<ContentModal
	title={ts.get.quick_add.title}
	onClose={() => quickAdd.closeModal()}
	rounded="2xl"
	width="[34rem]"
	p="8"
>
	{#if quickAdd.showTypeSelector}
		<div class="flex flex-col gap-6">
			<button
				class="flex w-fit cursor-pointer items-center gap-1 rounded-md p-1 text-xs text-c-neutral-5 transition-colors hover:text-c-heading dark:hover:text-c-primary"
				onclick={() => quickAdd.backToConfirmation()}
			>
				<IconArrowLeft class="h-3.5 w-3.5" />
				{ts.get.quick_add.back}
			</button>
			<p class="text-lg font-bold">{ts.get.quick_add.select_type}</p>
			<div class="grid grid-cols-3 gap-2 max-md:grid-cols-2">
				{#each ALL_TYPES as type, i}
					{@const Icon = TYPE_ICONS[type]}
					{@const isFocused = i === focusedTypeIndex}
					<button
						class="group flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-1 bg-c-bg-elevated px-3 py-3.5 text-c-heading transition-colors hover:border-c-btn hover:shadow-sm dark:text-c-primary {isFocused ? 'border-c-btn' : 'border-c-neutral-2 dark:border-s-dark-3'}"
						onclick={() => quickAdd.selectType(type)}
						onmouseenter={() => (focusedTypeIndex = i)}
					>
						<Icon class="h-5 w-5 transition-colors {isFocused ? 'text-c-btn' : 'text-c-neutral-5 group-hover:text-c-btn'}" />
						<span class="text-xs font-medium {isFocused ? 'text-c-btn' : ''}">{CONTENT_TYPE_LABELS[type]}</span>
					</button>
				{/each}
			</div>
		</div>
	{:else if quickAdd.needsConfirmation && quickAdd.detectedType}
		{@const DetectedIcon = TYPE_ICONS[quickAdd.detectedType]}
		<div class="flex flex-col gap-6">
			<div class="flex flex-col gap-4">
				<div class="flex w-full items-center gap-4 rounded-xl border-1 border-c-neutral-2 p-4 dark:border-s-dark-3">
					<DetectedIcon class="h-8 w-8 shrink-0 text-c-neutral-5" />
					<div class="flex flex-1 flex-col gap-1.5">
						<span class="text-lg font-bold">{CONTENT_TYPE_LABELS[quickAdd.detectedType]}</span>
						<div class="flex items-center gap-2">
							<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-c-neutral-2 dark:bg-s-dark-3">
								<div class="h-full rounded-full bg-c-btn transition-all" style="width: {confidencePercent()}%"></div>
							</div>
							<span class="text-xs text-c-neutral-5">{confidencePercent()}%</span>
						</div>
					</div>
				</div>
				{#if metadataEntries().length > 0}
					<div class="flex flex-col gap-2">
						{#each metadataEntries() as [key, value]}
							<ModalFormRow label={key.replace(/_/g, ' ')}>
								<span class="text-sm">{value}</span>
							</ModalFormRow>
						{/each}
					</div>
				{/if}
			</div>
			{#if quickAdd.error}
				<p class="rounded-lg bg-c-danger/10 px-3 py-2 text-sm text-c-danger">{quickAdd.error}</p>
			{/if}
			<div class="flex justify-end gap-2">
				<Button
					title={ts.get.quick_add.choose_different}
					type="slight"
					onclick={enterTypeSelector}
					disabled={quickAdd.loading}
				/>
				<Button
					title={ts.get.quick_add.confirm}
					onclick={() => quickAdd.confirm(quickAdd.detectedType!)}
					disabled={quickAdd.loading}
				/>
			</div>
		</div>
	{:else}
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex flex-col gap-6">
			<TextInput
				bind:input={urlInput}
				bind:value={quickAdd.url}
				placeholder={ts.get.quick_add.placeholder}
			/>
			{#if quickAdd.error}
				<p class="rounded-lg bg-c-danger/10 px-3 py-2 text-sm text-c-danger">{quickAdd.error}</p>
			{/if}
			<div class="flex justify-end">
				<Button
					title={quickAdd.loading ? ts.get.quick_add.adding : ts.get.quick_add.add}
					disabled={quickAdd.loading || !quickAdd.url.trim()}
					onclick={handleSubmit}
				/>
			</div>
		</form>
	{/if}
</ContentModal>
