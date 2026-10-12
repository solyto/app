<script lang="ts">
	import type { Todo, TodoPriority } from '$lib/types/todo';
	import IconUp from '@lucide/svelte/icons/circle-arrow-up';
	import IconRight from '@lucide/svelte/icons/circle-arrow-right';
	import IconDown from '@lucide/svelte/icons/circle-arrow-down';
	import { getTodos } from '$lib/state/Todos.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import QuickSelectOverlay from '$lib/components/ui/QuickSelectOverlay.svelte';

	let {
		todo,
		changePriority = true,
		expanded = false,
		simple = false,
		left = false,
		portal = false
	} = $props<{
		todo: Todo;
		changePriority: boolean;
		expanded: boolean;
		simple?: boolean;
		left?: boolean;
		portal?: boolean;
	}>();

	const todos = getTodos();
	const loadingIndicator = getLoadingIndicator();

	let priorityMenuVisible = $state<boolean>(false);
	let trigger = $state<HTMLDivElement | null>(null);

	function togglePriorityMenu(): void {
		priorityMenuVisible = !priorityMenuVisible;
	}

	async function handlePriorityChange(todo: Todo, priority: TodoPriority): Promise<void> {
		loadingIndicator.start();
		togglePriorityMenu();
		await todos.changePriority(todo, priority);
		await todos.load();

		loadingIndicator.stop();
	}

	function getBgColor(priority: string): string {
		if (todos.view !== 'list' || simple) {
			return 'bg-transparent';
		}

		switch (priority) {
			case 'high':
				return 'bg-c-danger';
			case 'medium':
			default:
				return 'bg-c-btn';
			case 'low':
				return 'bg-c-success';
		}
	}

	function getColor(priority: string): string {
		if ((todos.view === 'list' || todos.view === 'grouped')) {
			return 'text-white';
		}

		switch (priority) {
			case 'high':
				return 'text-c-danger';
			case 'medium':
			default:
				return 'text-c-btn-hover';
			case 'low':
				return 'text-c-success';
		}
	}
</script>

<div
	bind:this={trigger}
	class="
		relative flex items-center rounded-l-md transition-all duration-300
		max-2xl:rounded-full
	"
	class:justify-center={!left}
	class:justify-start={left}
	class:p-4={(todos.view === 'list' || todos.view === 'grouped') && !simple}
	class:2xl:w-full={(todos.view === 'list' || todos.view === 'grouped')}
	class:2xl:h-full={(todos.view === 'list' || todos.view === 'grouped')}
	class:rounded-bl-none={expanded}
	class:rounded-br-md={expanded}
>
	{#if changePriority}
		{#if todo.priority === 'high'}
			<IconUp
				class="cursor-pointer rounded-full text-c-danger hover:bg-c-neutral dark:hover:bg-s-dark-3"
				onclick={togglePriorityMenu}
			/>
		{:else if todo.priority === 'medium'}
			<IconRight
				class="cursor-pointer rounded-full text-c-btn hover:bg-c-neutral dark:hover:bg-s-dark-3"
				onclick={togglePriorityMenu}
			/>
		{:else if todo.priority === 'low'}
			<IconDown
				class="cursor-pointer rounded-full text-c-success hover:bg-c-neutral dark:hover:bg-s-dark-3"
				onclick={togglePriorityMenu}
			/>
		{/if}
		{#if priorityMenuVisible}
			<QuickSelectOverlay onClose={() => (priorityMenuVisible = false)} {portal} target={trigger}>
				<IconUp
					class="cursor-pointer rounded-full text-c-danger hover:bg-c-neutral dark:hover:bg-s-dark-3"
					onclick={() => handlePriorityChange(todo, 'high')}
				/>
				<IconRight
					class="cursor-pointer rounded-full text-c-btn hover:bg-c-neutral dark:hover:bg-s-dark-3"
					onclick={() => handlePriorityChange(todo, 'medium')}
				/>
				<IconDown
					class="cursor-pointer rounded-full text-c-success hover:bg-c-neutral dark:hover:bg-s-dark-3"
					onclick={() => handlePriorityChange(todo, 'low')}
				/>
			</QuickSelectOverlay>
		{/if}
	{:else if todo.priority === 'high'}
		<IconUp class="text-c-danger" />
	{:else if todo.priority === 'medium'}
		<IconRight class="text-c-btn" />
	{:else if todo.priority === 'low'}
		<IconDown class="text-c-success" />
	{/if}
</div>
