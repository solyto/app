<script lang="ts">
	import type { Todo } from '$lib/types/todo';
	import { fade } from 'svelte/transition';
	import DueDate from '$lib/components/todos/props/DueDate.svelte';
	import Category from '$lib/components/todos/props/Category.svelte';
	import Tags from '$lib/components/todos/props/Tags.svelte';
	import Checkbox from '$lib/components/forms/Checkbox.svelte';
	import EditButton from '$lib/components/ui/buttons/EditButton.svelte';
	import { getTodos } from '$lib/state/Todos.svelte';

	let {
		todo,
		handleCheck,
		minimal = true
	} = $props<{
		todo: Todo;
		handleCheck: (event: Event, todo: Todo) => Promise<void>;
		minimal?: boolean;
	}>();

	const todos = getTodos();

	function getBgColor(todo: Todo): string {
		switch (todo.priority) {
			case 'low':
				return 'bg-c-success';
			case 'high':
				return 'bg-c-danger';
			default:
				return 'bg-c-btn';
		}
	}
</script>

<div
	class="relative rounded-lg border-1 bg-c-bg-surface px-4 py-2 shadow-sm transition-all {todos.recentlyCreated === todo.id ? 'border-c-btn-hover' : 'border-d-lightblue dark:border-s-dark'}"
	class:opacity-50={todo.is_completed}
	in:fade
>
	<div class="absolute top-0 left-0 h-full w-1 rounded-l-md {getBgColor(todo)}"></div>
	<div class="flex items-center gap-3">
		<span class="flex-1 truncate" class:line-through={todo.is_completed}>
			{todo.title}
		</span>
		<div class="flex shrink-0 items-center gap-2">
			<EditButton onClick={() => todos.openEdit(todo.id)} inModal={false} buttonStyle="minimal" />
			<Checkbox isChecked={todo.is_completed} onchange={(e: Event) => handleCheck(e, todo)} />
		</div>
	</div>
	{#if !minimal}
		<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
			{#if todo.due_at}
				<DueDate {todo} />
			{/if}
			<Category {todo} readonly />
			<Tags {todo} readonly />
		</div>
	{/if}
</div>