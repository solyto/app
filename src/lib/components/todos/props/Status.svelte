<script lang="ts">
	import type { Todo, TodoStatus } from '$lib/types/todo';
	import { getTodos } from '$lib/state/Todos.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { clickOutside } from '$lib/helpers/ClickHelper';

	let { todo, changeStatus } = $props<{ todo: Todo; changeStatus: boolean }>();

	const todos = getTodos();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();

	let statusMenuVisible = $state<boolean>(false);

	function toggleStatusMenu(): void {
		statusMenuVisible = !statusMenuVisible;
	}

	async function handleStatusChange(todo: Todo, status: TodoStatus): Promise<void> {
		loadingIndicator.start();
		await todos.changeStatus(todo.id, status);
		await todos.load();

		toggleStatusMenu();
		loadingIndicator.stop();
	}

	function getColor(status: TodoStatus): string {
		switch (status) {
			case 'pending':
			default:
				return 'bg-c-neutral-2';
			case 'backlog':
				return 'border-1 border-c-neutral-2 dark:border-s-dark-3';
			case 'in-progress':
				return 'bg-c-action';
			case 'waiting':
				return 'bg-c-primary';
			case 'almost-done':
				return 'bg-c-success';
		}
	}

	function getLabel(status: TodoStatus): string {
		switch (status) {
			case 'pending':
			default:
				return ts.get.todos.status_pending;
			case 'backlog':
				return ts.get.todos.status_backlog;
			case 'in-progress':
				return ts.get.todos.status_in_progress;
			case 'waiting':
				return ts.get.todos.status_waiting;
			case 'almost-done':
				return ts.get.todos.status_almost_done;
		}
	}
</script>

<div class="relative">
	{#if changeStatus}
		<div
			class="cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-c-neutral-7 {getColor(
				todo.status
			)}"
			onclick={toggleStatusMenu}
		>
			{getLabel(todo.status)}
		</div>
		{#if statusMenuVisible}
			<div
				use:clickOutside={() => {
					statusMenuVisible = false;
				}}
				class="absolute top-0 z-30 flex w-48 flex-col gap-2 rounded-lg bg-white p-4 font-bold text-c-neutral-7 drop-shadow-lg dark:bg-s-dark-2"
			>
				<div
					class="cursor-pointer rounded-lg px-2 py-1 text-xs dark:text-white {getColor(
						'backlog'
					)}"
					onclick={() => handleStatusChange(todo, 'backlog')}
				>
					{getLabel('backlog')}
				</div>
				<div
					class="cursor-pointer rounded-lg px-2 py-1 text-xs {getColor('pending')}"
					onclick={() => handleStatusChange(todo, 'pending')}
				>
					{getLabel('pending')}
				</div>
				<div
					class="cursor-pointer rounded-lg px-2 py-1 text-xs {getColor('in-progress')}"
					onclick={() => handleStatusChange(todo, 'in-progress')}
				>
					{getLabel('in-progress')}
				</div>
				<div
					class="cursor-pointer rounded-lg px-2 py-1 text-xs {getColor('waiting')}"
					onclick={() => handleStatusChange(todo, 'waiting')}
				>
					{getLabel('waiting')}
				</div>
				<div
					class="cursor-pointer rounded-lg px-2 py-1 text-xs {getColor('almost-done')}"
					onclick={() => handleStatusChange(todo, 'almost-done')}
				>
					{getLabel('almost-done')}
				</div>
			</div>
		{/if}
	{:else}
		<div class="rounded-lg px-2 py-1 text-xs {getColor(todo.status)}">
			{getLabel(todo.status)}
		</div>
	{/if}
</div>
