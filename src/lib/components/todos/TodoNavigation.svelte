	<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { TodoNavigationSection } from '$lib/types/todo';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import ListAndAdd from './ListAndAdd.svelte';
	import { getTodos } from '$lib/state/Todos.svelte';
	import { getTags } from '$lib/state/Tags.svelte';
	import IconSub from '$lib/components/ui/icons/IconSub.svelte';
	import IconFunnel from '@lucide/svelte/icons/funnel';

	const ts = getTranslation();
	const todos = getTodos();
	const tags = getTags();

	let navigation = $state<HTMLDivElement | null>(null);
	let categoriesExpanded = $state<boolean>(true);
	let tagsExpanded = $state<boolean>(false);

	const sections: TodoNavigationSection[] = [
		{
			header: ts.get.todos.priority,
			items: [
				{ filter: { type: 'priority', value: 'high' }, label: ts.get.todos.priority_high },
				{
					filter: { type: 'priority', value: 'medium' },
					label: ts.get.todos.priority_medium
				},
				{ filter: { type: 'priority', value: 'low' }, label: ts.get.todos.priority_low }
			]
		},
		{
			header: ts.get.todos.status,
			items: [
				{
					filter: { type: 'status', value: 'backlog' },
					label: ts.get.todos.status_backlog
				},
				{
					filter: { type: 'status', value: 'pending' },
					label: ts.get.todos.status_pending
				},
				{
					filter: { type: 'status', value: 'in-progress' },
					label: ts.get.todos.status_in_progress
				},
				{
					filter: { type: 'status', value: 'waiting' },
					label: ts.get.todos.status_waiting
				},
				{
					filter: { type: 'status', value: 'almost-done' },
					label: ts.get.todos.status_almost_done
				}
			]
		},
		{
			header: ts.get.todos.effort,
			items: [
				{ filter: { type: 'effort', value: 'low' }, label: ts.get.todos.effort_low },
				{ filter: { type: 'effort', value: 'medium' }, label: ts.get.todos.effort_medium },
				{ filter: { type: 'effort', value: 'high' }, label: ts.get.todos.effort_high }
			]
		},
		{
			header: ts.get.todos.due_at,
			items: [
				{ filter: { type: 'due', value: 'today' }, label: ts.get.todos.due_today },
				{ filter: { type: 'due', value: 'tomorrow' }, label: ts.get.todos.due_tomorrow },
				{ filter: { type: 'due', value: 'week' }, label: ts.get.todos.due_week },
				{ filter: { type: 'due', value: 'overdue' }, label: ts.get.todos.due_overdue }
			]
		}
	];

	function toggleMobile(): void {
		if (navigation) {
			navigation.style.display = 'block';
		}
	}

	function handleNavigation(): void {
		if (navigation && navigation.style.display === 'block') {
			navigation.style.display = 'none';
		}
	}
</script>

<button
	class="absolute top-4 left-4 z-40 cursor-pointer rounded-lg p-4 not-dark:bg-c-neutral-1 hover:bg-c-neutral-2 lg:hidden dark:hover:bg-s-dark-3"
	onclick={toggleMobile}
>
	<IconFunnel />
</button>
<div
	class="absolute z-50 hidden h-full max-h-screen w-full flex-col overflow-y-auto bg-c-bg p-2 drop-shadow-xl lg:relative lg:flex lg:w-32 2xl:w-60 2xl:p-4 dark:border-r-1 dark:border-s-dark-2 dark:drop-shadow-sm dark:drop-shadow-s-dark-shadow"
	in:fade
	bind:this={navigation}
>
	<a
		href="?"
		onclick={() => {
			todos.useFilters([]);
			handleNavigation();
		}}
	>
		<div
			class="cursor-pointer rounded-lg p-2 hover:bg-c-neutral-1 dark:hover:bg-s-dark-3 {todos
				.activeFilters.length === 0
				? 'bg-c-neutral-1 dark:bg-s-dark-3'
				: ''}"
		>
			{ts.get.todos.all_todos}
		</div>
	</a>
	{#if todos.workspaces.length > 0}
		<div class="mt-2 p-2 text-base font-bold 2xl:text-2xl 2xl:font-normal">
			{ts.get.todos.workspaces}
		</div>
		{#each todos.workspaces as workspace (workspace.id)}
			<a
				href="?filterType=workspace&filterValue={workspace.id}"
				onclick={() => {
					todos.useFilters([{ type: 'workspace', value: workspace }]);
					handleNavigation();
				}}
				in:fade
			>
				<div
					class="flex cursor-pointer flex-row items-center rounded-lg px-2 py-1 text-sm hover:bg-c-neutral 2xl:text-base dark:hover:bg-s-dark-3 {todos.isFilterActive(
						{ type: 'workspace', value: workspace }
					)
						? 'bg-c-neutral-1 dark:bg-s-dark-3'
						: ''}"
				>
					{workspace.title}
				</div>
			</a>
		{/each}
	{/if}
	<a
		href="#"
		onclick={() => {
			categoriesExpanded = !categoriesExpanded;
		}}
	>
		<ListAndAdd
			title={ts.get.todos.categories}
			type="category"
			onStart={() => (categoriesExpanded = false)}
			onFinish={() => (categoriesExpanded = true)}
		/>
	</a>
	{#if categoriesExpanded}
		{#each todos.filteredCategories as category (category.id)}
			<a
				href="?filterType=category&filterValue={category.id}"
				onclick={() => {
					todos.useFilters([{ type: 'category', value: category.id }]);
					handleNavigation();
				}}
				in:fade
			>
				<div
					class="flex cursor-pointer flex-row items-center rounded-lg px-2 py-1 text-sm hover:bg-c-neutral 2xl:text-base dark:hover:bg-s-dark-3 {todos.isFilterActive(
						{ type: 'category', value: category.id }
					)
						? 'bg-c-neutral-1 dark:bg-s-dark-3'
						: ''}"
				>
					{#if category.title.includes('/')}
						<IconSub /> /{category.title.split('/').pop()}
					{:else}
						/{category.title}
					{/if}
				</div>
			</a>
		{/each}
	{/if}
	{#each sections as section (section.header)}
		<div class="mt-2 p-2 text-base font-bold 2xl:text-2xl 2xl:font-normal">
			{section.header}
		</div>
		{#each section.items as item (item.filter)}
			<a
				href="?filterType={item.filter.type}&filterValue={item.filter.value}"
				onclick={() => {
					todos.useFilters([item.filter]);
					handleNavigation();
				}}
			>
				<div
					class="cursor-pointer rounded-lg px-2 py-1 text-sm hover:bg-c-neutral 2xl:text-base dark:hover:bg-s-dark-3 {todos.isFilterActive(
						item.filter
					)
						? 'bg-c-neutral-1 dark:bg-s-dark-3'
						: ''}"
				>
					{item.label}
				</div>
			</a>
		{/each}
	{/each}
	<a
		href="#"
		onclick={() => {
			tagsExpanded = !tagsExpanded;
		}}
	>
		<ListAndAdd
			title={ts.get.todos.tags}
			type="tag"
			onStart={() => (tagsExpanded = false)}
			onFinish={() => (tagsExpanded = true)}
		/>
	</a>
	{#if tagsExpanded}
		{#each tags.tags as tag (tag.id)}
			<a
				href="?filterType=tag&filterValue={tag.id}"
				onclick={() => {
					todos.useFilters([{ type: 'tag', value: tag.id }]);
					handleNavigation();
				}}
				in:fade
			>
				<div
					class="cursor-pointer rounded-lg px-2 py-1 text-sm hover:bg-c-neutral 2xl:text-base dark:hover:bg-s-dark-3 {tag.id ===
					todos.isFilterActive({ type: 'tag', value: tag.id })
						? 'bg-c-neutral-1 dark:bg-s-dark-3'
						: ''}"
				>
					#{tag.name}
				</div>
			</a>
		{/each}
	{/if}
</div>
