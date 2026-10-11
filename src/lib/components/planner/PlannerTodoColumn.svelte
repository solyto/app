<script lang="ts">
	import { getPlanner } from '$lib/state/Planner.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { apiRoutes } from '$lib/config/apiRoutes';
	import Checkbox from '$lib/components/forms/Checkbox.svelte';
	import type { Todo } from '$lib/types/todo';

	const planner = getPlanner();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();

	let dueTodos = $derived(planner.getTodosForDate(planner.selectedDay));
	let overdueTodos = $derived(planner.getOverdueTodos());

	async function toggle(todo: Todo): Promise<void> {
		loadingIndicator.start();
		await planner.apiService.update(apiRoutes.todos.update, todo.id, {
			is_completed: !todo.is_completed
		});
		await planner.load();
		loadingIndicator.stop();
	}

	function priorityDot(todo: Todo): string {
		if (todo.priority === 'high') return 'bg-c-danger';
		if (todo.priority === 'medium') return 'bg-c-btn';
		return 'bg-c-success';
	}
</script>

<div class="flex w-full flex-col gap-3">
	<div class="flex w-full items-center justify-between">
		<span class="text-sm font-bold">{ts.get.planner.todos}</span>
	</div>

	<div class="flex flex-col gap-0.5">
		{#if dueTodos.length === 0 && overdueTodos.length === 0}
			<span class="text-sm opacity-60">{ts.get.planner.no_entries}</span>
		{/if}
		{#each overdueTodos as todo (todo.id)}
			<button
				class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-all hover:bg-c-neutral dark:hover:bg-s-dark-3"
				onclick={() => toggle(todo)}
			>
				<span class="size-2 shrink-0 rounded-full {priorityDot(todo)}"></span>
				<Checkbox
					isChecked={todo.is_completed}
					onchange={() => toggle(todo)}
					class="scale-80"
				/>
				<span
					class="grow truncate text-c-danger line-through decoration-c-danger/70 {todo.is_completed
						? 'opacity-60'
						: ''}"
				>
					{todo.title}
				</span>
			</button>
		{/each}
		{#each dueTodos as todo (todo.id)}
			<button
				class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-all hover:bg-c-neutral dark:hover:bg-s-dark-3"
				onclick={() => toggle(todo)}
			>
				<span class="size-2 shrink-0 rounded-full {priorityDot(todo)}"></span>
				<Checkbox
					isChecked={todo.is_completed}
					onchange={() => toggle(todo)}
					class="scale-80"
				/>
				<span class="grow truncate {todo.is_completed ? 'line-through opacity-60' : ''}">
					{todo.title}
				</span>
			</button>
		{/each}
	</div>
</div>
