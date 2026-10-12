<script lang="ts">
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import Status from '$lib/components/todos/props/Status.svelte';
	import Priority from '$lib/components/todos/props/Priority.svelte';
	import Category from '$lib/components/todos/props/Category.svelte';
	import Tags from '$lib/components/todos/props/Tags.svelte';
	import Effort from '$lib/components/todos/props/Effort.svelte';
	import DueDate from '$lib/components/todos/props/DueDate.svelte';
	import Progress from '$lib/components/todos/props/Progress.svelte';
	import SaveButton from '$lib/components/ui/buttons/SaveButton.svelte';
	import { getTodos } from '$lib/state/Todos.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getKeyManager } from '$lib/KeyManager.svelte';
	import { onDestroy } from 'svelte';

	const todos = getTodos();
	const ts = getTranslation();
	const keyManager = getKeyManager();

	let title = $state<string>('');
	let openedTodoId = $state<string | null>(null);
	let keyHandlers = $state<{ [key: string]: string | null }>({ Enter: null });

	onDestroy(() => keyManager.unregisterAll(keyHandlers));

	function handleEnter(event: KeyboardEvent): void {
		handleSaveTitle();
	}

	function handleSaveTitle(): void {
		if (todos.editingTodo) {
			todos.changeTitle(todos.editingTodo, title);
		}
	}

	$effect(() => {
		const id = todos.editingTodoId;
		if (id === null) {
			keyManager.unregisterAll(keyHandlers);
			return;
		}
		if (id === openedTodoId) return;
		openedTodoId = id;
		title = todos.editingTodo?.title ?? '';
		keyHandlers.Enter = keyManager.registerKeyDown('Enter', handleEnter);
	});
</script>

{#if todos.editingTodo}
	{@const todo = todos.editingTodo}
	<ContentModal title={todo.title} onClose={() => todos.closeEdit()} rounded="2xl">
		<div class="flex w-full flex-col gap-4">
			<ModalFormRow label={ts.get.todos.title}>
				<div class="flex w-full flex-row items-center space-x-2">
					<div class="flex-1">
						<TextInput bind:value={title} onblur={handleSaveTitle} />
					</div>
					<SaveButton onClick={handleSaveTitle} />
				</div>
			</ModalFormRow>
			<ModalFormRow label={ts.get.todos.status}>
				<Status {todo} changeStatus={true} portal />
			</ModalFormRow>
			<ModalFormRow label={ts.get.todos.priority}>
				<Priority {todo} changePriority={true} left portal expanded={false} />
			</ModalFormRow>
			<ModalFormRow label={ts.get.todos.categories}>
				<Category {todo} />
			</ModalFormRow>
			<ModalFormRow label={ts.get.todos.tags}>
				<Tags {todo} />
			</ModalFormRow>
			<ModalFormRow label={ts.get.todos.effort}>
				<Effort {todo} changeEffort={true} left portal />
			</ModalFormRow>
			<ModalFormRow label={ts.get.todos.due_at}>
				<DueDate {todo} portal />
			</ModalFormRow>
			<ModalFormRow label={ts.get.todos.progress}>
				<Progress {todo} />
			</ModalFormRow>
		</div>
	</ContentModal>
{/if}