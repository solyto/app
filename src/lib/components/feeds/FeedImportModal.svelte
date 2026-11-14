<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import FileUpload from '$lib/components/forms/FileUpload.svelte';
	import Checkbox from '$lib/components/forms/Checkbox.svelte';
	import FeedImportService, { type FeedImportFailureReason, type FeedImportResult } from '$lib/services/FeedImportService';
	import { getFeedImport } from '$lib/state/FeedImport.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import type { FeedImportStage, FeedImportState } from '$lib/types/feed';

	type View = 'picker' | 'preview' | 'progress' | 'result' | 'failed' | 'unavailable';

	const POLL_INTERVAL_MS = 1000;
	const POLL_TIMEOUT_MS = 300000;
	const MUTED = 'text-xs text-c-neutral-5 dark:text-c-neutral-4';

	const ts = getTranslation();
	const feedImport = getFeedImport();
	const loadingIndicator = getLoadingIndicator();
	const service = new FeedImportService();

	let view = $state<View | null>(null);
	let selected = $state<string[]>([]);
	let result = $state<FeedImportResult | null>(null);
	let error = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	let polling = false;
	let destroyed = false;
	let lastProgressAt = 0;
	let lastProcessed: number | null = null;
	let pollTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(open);

	onDestroy(destroy);

	async function open(): Promise<void> {
		loadingIndicator.start();
		try {
			const found = await feedImport.refresh();
			showStage(found ? feedImport.state?.stage : undefined);
		} catch {
			error = ts.get.feeds.import_error_generic;
			view = 'unavailable';
		} finally {
			loadingIndicator.stop();
		}
	}

	function retry(): void {
		error = null;
		open();
	}

	function showStage(stage: FeedImportStage | undefined): void {
		switch (stage) {
			case 'running':
				view = 'progress';
				startPolling();
				break;
			case 'finished':
				showResult();
				break;
			default:
				view = 'picker';
		}
	}

	function showResult(): void {
		if (!feedImport.state) return;
		result = service.group(feedImport.state);
		error = null;
		view = 'result';
	}

	async function upload(file: File): Promise<void> {
		error = null;
		loadingIndicator.start();
		try {
			const res = await feedImport.upload(file);
			if (res.status === 409) {
				error = uploadErrorMessage(res.status);
				const found = await feedImport.refresh();
				showStage(found ? feedImport.state?.stage : undefined);
				return;
			}
			if (!res.ok || !feedImport.state) {
				error = uploadErrorMessage(res.status);
				return;
			}
			selected = service.initialSelection(feedImport.state);
			view = 'preview';
		} finally {
			if (fileInput) fileInput.value = '';
			loadingIndicator.stop();
		}
	}

	function uploadErrorMessage(status: number): string {
		switch (status) {
			case 422:
				return ts.get.feeds.import_error_unreadable;
			case 409:
				return ts.get.feeds.import_error_running;
			case 429:
				return ts.get.feeds.import_error_rate_limited;
			default:
				return ts.get.feeds.import_error_generic;
		}
	}

	async function startImport(): Promise<void> {
		error = null;
		loadingIndicator.start();
		try {
			const res = await feedImport.select(selected);
			if (!res.ok) {
				error = ts.get.feeds.import_error_generic;
				feedImport.reset();
				view = 'picker';
				return;
			}
			view = 'progress';
			startPolling();
		} finally {
			loadingIndicator.stop();
		}
	}

	function startPolling(): void {
		if (destroyed) return;
		polling = true;
		lastProgressAt = Date.now();
		lastProcessed = feedImport.state?.processed ?? null;
		scheduleNextPoll();
	}

	function scheduleNextPoll(): void {
		if (destroyed) return;
		pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
	}

	async function poll(): Promise<void> {
		pollTimer = null;
		try {
			await feedImport.refresh();
		} finally {
			continuePolling();
		}
	}

	function continuePolling(): void {
		if (!polling) return;

		if (feedImport.state?.stage === 'finished') {
			stopPolling();
			showResult();
			return;
		}

		const processed = feedImport.state?.processed ?? null;
		if (processed !== lastProcessed) {
			lastProcessed = processed;
			lastProgressAt = Date.now();
		}

		if (Date.now() - lastProgressAt >= POLL_TIMEOUT_MS) {
			stopPolling();
			error = ts.get.feeds.import_error_generic;
			view = 'failed';
			return;
		}

		scheduleNextPoll();
	}

	function stopPolling(): void {
		polling = false;
		if (pollTimer) clearTimeout(pollTimer);
		pollTimer = null;
	}

	function destroy(): void {
		destroyed = true;
		stopPolling();
	}

	function toggle(url: string): void {
		selected = service.toggle(selected, url);
	}

	function toggleAll(): void {
		if (!feedImport.state) return;
		selected = service.toggleAll(feedImport.state, selected);
	}

	function toggleAllLabel(state: FeedImportState): string {
		return service.allSelected(state, selected) ? ts.get.feeds.import_select_none : ts.get.feeds.import_select_all;
	}

	function selectedLabel(): string {
		return selected.length === 1
			? ts.get.feeds.import_selected_singular
			: ts.get.feeds.import_selected_plural.replace('{n}', String(selected.length));
	}

	function progressLabel(state: FeedImportState): string {
		return ts.get.feeds.import_progress.replace('{n}', String(state.processed)).replace('{total}', String(state.total));
	}

	function withCount(text: string, count: number): string {
		return text.replace('{n}', String(count));
	}

	function reasonLabel(reason: FeedImportFailureReason): string {
		return reason === 'unreachable' ? ts.get.feeds.import_reason_unreachable : ts.get.feeds.import_reason_not_a_feed;
	}

	function importAnother(): void {
		feedImport.reset();
		selected = [];
		result = null;
		error = null;
		view = 'picker';
	}

	function close(): void {
		feedImport.modalOpen = false;
	}
</script>

{#snippet heading(text: string)}
	<h3 class="text-sm font-semibold text-c-heading dark:text-c-primary">{text}</h3>
{/snippet}

<ContentModal title={ts.get.feeds.import_opml} onClose={close} rounded="2xl" p="8" width="2xl">
	<div class="flex flex-col gap-4">
		{#if error}
			<p class="text-sm text-c-danger">{error}</p>
		{/if}

		{#if view === 'picker'}
			<p class="text-sm">{ts.get.feeds.import_hint}</p>
			<FileUpload accept=".opml,.xml" bind:input={fileInput} onfile={upload} />
		{:else if view === 'preview' && feedImport.state}
			{@const importState = feedImport.state}
			<div class="flex items-center justify-between gap-4">
				<TextButton type="plain" title={toggleAllLabel(importState)} onclick={toggleAll} />
				<span class={MUTED}>{selectedLabel()}</span>
			</div>
			<div class="flex max-h-[50vh] flex-col gap-1 overflow-y-auto">
				{#each importState.feeds as feed (feed.url)}
					<div class="flex items-center gap-3 rounded-lg p-2">
						<Checkbox isChecked={selected.includes(feed.url)} disabled={feed.already_subscribed} onchange={() => toggle(feed.url)} />
						<div class="flex min-w-0 flex-1 flex-col" class:opacity-60={feed.already_subscribed}>
							<span class="truncate">{feed.title}</span>
							<span class="truncate {MUTED}">{feed.url}</span>
						</div>
						{#if feed.already_subscribed}
							<span class="shrink-0 {MUTED}">{ts.get.feeds.import_already_subscribed}</span>
						{/if}
					</div>
				{/each}
			</div>
			<TextButton type="primary" title={ts.get.feeds.import_button} disabled={selected.length === 0} onclick={startImport} />
		{:else if view === 'progress' && feedImport.state}
			<p class="text-sm">{progressLabel(feedImport.state)}</p>
			<ProgressBar value={service.progress(feedImport.state)} />
		{:else if view === 'result' && result}
			{@render heading(withCount(ts.get.feeds.import_result_added, result.added.length))}
			{#if result.alreadySubscribed.length > 0}
				{@render heading(withCount(ts.get.feeds.import_result_already_subscribed, result.alreadySubscribed.length))}
			{/if}
			{#if result.failed.length > 0}
				{@render heading(withCount(ts.get.feeds.import_result_failed, result.failed.length))}
				<div class="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
					{#each result.failed as failure (failure.url)}
						<div class="flex min-w-0 flex-col">
							<span class="truncate">{failure.title}</span>
							<span class="truncate {MUTED}">{failure.url}</span>
							<span class="text-xs text-c-danger">{reasonLabel(failure.reason)}</span>
						</div>
					{/each}
				</div>
			{/if}
			<div class="flex justify-end gap-2">
				<TextButton title={ts.get.feeds.import_another} onclick={importAnother} />
				<TextButton type="primary" title={ts.get.feeds.import_close} onclick={close} />
			</div>
		{:else if view === 'failed'}
			<div class="flex justify-end">
				<TextButton type="primary" title={ts.get.feeds.import_close} onclick={close} />
			</div>
		{:else if view === 'unavailable'}
			<div class="flex justify-end gap-2">
				<TextButton title={ts.get.feeds.import_close} onclick={close} />
				<TextButton type="primary" title={ts.get.feeds.import_retry} onclick={retry} />
			</div>
		{/if}
	</div>
</ContentModal>
