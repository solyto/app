<script lang="ts">
	import { fade, blur, scale } from 'svelte/transition';
	import { getCommandPalette } from '$lib/state/CommandPalette.svelte';
	import { getKeyManager } from '$lib/KeyManager.svelte';
	import { onDestroy, onMount, tick } from 'svelte';
	import IconSearch from '@lucide/svelte/icons/search';
	import IconX from '@lucide/svelte/icons/x';
	import IconCornerDownLeft from '@lucide/svelte/icons/corner-down-left';

	const palette = getCommandPalette();
	const keyManager = getKeyManager();

	let inputEl = $state<HTMLInputElement | null>(null);
	let listEl = $state<HTMLElement | null>(null);
	let keyHandlers: Record<string, string | null> = { Escape: null, Enter: null, ArrowDown: null, ArrowUp: null };

	$effect(() => {
		if (palette.activeCommand !== null) tick().then(() => inputEl?.focus());
	});

	onMount(async () => {
		keyHandlers.Escape = keyManager.registerKeyDown('Escape', () => {
			if (palette.activeCommand) palette.backToCommands();
			else palette.closePalette();
		}, { priority: 0 });
		keyHandlers.Enter = keyManager.registerKeyDown('Enter', () => {
			if (palette.activeCommand) palette.submitInput();
			else palette.executeSelected();
		}, { priority: 0 });
		await tick();
		inputEl?.focus();
	});

	onDestroy(() => keyManager.unregisterAll(keyHandlers));

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			palette.selectNext();
			scrollSelectedIntoView();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			palette.selectPrev();
			scrollSelectedIntoView();
		}
	}

	function scrollSelectedIntoView() {
		tick().then(() => {
			const el = listEl?.querySelector('[data-selected="true"]');
			el?.scrollIntoView({ block: 'nearest' });
		});
	}

	function onQueryInput() {
		palette.selectedIndex = 0;
	}
</script>

<div
	class="fixed top-0 left-0 z-50 flex h-dvh w-screen items-start justify-center bg-transparent pt-[15vh] backdrop-blur-xs"
	out:fade={{ duration: 150 }}
	in:blur={{ duration: 200 }}
	role="dialog"
	aria-modal="true"
	onmousedown={(e) => { if (e.target === e.currentTarget) palette.closePalette(); }}
>
	<div
		class="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border-1 border-c-neutral-1 bg-c-bg-modal shadow-xl dark:border-s-dark-2 dark:shadow-s-dark-shadow"
		in:scale={{ start: 0.96, duration: 200 }}
	>
		{#if palette.activeCommand}
			<!-- Input mode -->
			<div class="flex items-center gap-3 px-4 py-3">
				<button
					class="cursor-pointer text-c-neutral-4 transition-colors hover:text-c-neutral-7 dark:hover:text-white"
					onclick={() => palette.backToCommands()}
					tabindex="-1"
				>
					<IconX class="size-4" />
				</button>
				<span class="shrink-0 text-sm font-medium dark:text-white">{palette.activeCommand.title}</span>
				<input
					bind:this={inputEl}
					bind:value={palette.pendingInput}
					type="text"
					placeholder={palette.activeCommand.inputPlaceholder ?? ''}
					class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-c-neutral-4 dark:text-white"
				/>
			</div>
		{:else}
			<!-- Search row -->
			<div class="flex items-center gap-3 px-4 py-3">
				<IconSearch class="size-4 shrink-0 text-c-neutral-4" />
				<input
					bind:this={inputEl}
					bind:value={palette.query}
					oninput={onQueryInput}
					onkeydown={handleKeyDown}
					type="text"
					placeholder="Type a command…"
					class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-c-neutral-4 dark:text-white"
				/>
				{#if palette.query}
					<button
						class="cursor-pointer text-c-neutral-4 transition-colors hover:text-c-neutral-7 dark:hover:text-white"
						onclick={() => { palette.query = ''; palette.selectedIndex = 0; inputEl?.focus(); }}
						tabindex="-1"
					>
						<IconX class="size-4" />
					</button>
				{/if}
			</div>
		{/if}

		<!-- Results -->
		{#if !palette.activeCommand && palette.filtered.length > 0}
			<div class="border-t-1 border-c-neutral-1 dark:border-s-dark-2"></div>
			<ul
				bind:this={listEl}
				class="max-h-72 overflow-y-auto py-1"
				role="listbox"
			>
				{#each palette.filtered as command, i (command.id)}
					<li role="option" aria-selected={i === palette.selectedIndex}>
						<button
							data-selected={i === palette.selectedIndex}
							class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors"
							class:bg-c-neutral={i === palette.selectedIndex}
							class:dark:bg-s-dark-3={i === palette.selectedIndex}
							onclick={() => { palette.selectedIndex = i; palette.executeSelected(); }}
							onmouseenter={() => { palette.selectedIndex = i; }}
						>
							{#if command.icon}
								{@const Icon = command.icon as any}
								<Icon class="size-4 shrink-0 text-c-neutral-5" />
							{/if}
							<div class="min-w-0 flex-1">
								<div class="truncate text-sm font-medium">{command.title}</div>
								{#if command.subtitle}
									<div class="truncate text-xs text-c-neutral-5">{command.subtitle}</div>
								{/if}
							</div>
							{#if command.category}
								<span class="shrink-0 rounded-md border-1 border-c-neutral-2 px-1.5 py-0.5 text-xs text-c-neutral-5 dark:border-s-dark-3">
									{command.category}
								</span>
							{/if}
							{#if i === palette.selectedIndex}
								<IconCornerDownLeft class="size-3.5 shrink-0 text-c-neutral-4" />
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{:else if !palette.activeCommand && palette.query}
			<div class="border-t-1 border-c-neutral-1 dark:border-s-dark-2"></div>
			<div class="px-4 py-6 text-center text-sm text-c-neutral-5">No commands found.</div>
		{/if}

		<!-- Footer hint -->
		<div class="flex items-center gap-3 border-t-1 border-c-neutral-1 px-4 py-2 dark:border-s-dark-2">
			<span class="text-xs text-c-neutral-4">↑↓ navigate</span>
			<span class="text-xs text-c-neutral-4">↵ run</span>
			<span class="text-xs text-c-neutral-4">esc close</span>
		</div>
	</div>
</div>
