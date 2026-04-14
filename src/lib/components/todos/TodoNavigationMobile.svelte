<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { getTodos } from '$lib/state/Todos.svelte';
	import { getTags } from '$lib/state/Tags.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import type { TodoFilter, TodoNavigationSection } from '$lib/types/todo';
	import IconFunnel from '@lucide/svelte/icons/funnel';
	import IconChevronRight from '@lucide/svelte/icons/chevron-right';
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CloseButton from '$lib/components/ui/buttons/CloseButton.svelte';
	import IconSub from '$lib/components/ui/icons/IconSub.svelte';

	const ts = getTranslation();
	const todos = getTodos();
	const tags = getTags();

	type SectionKey =
		| 'workspaces'
		| 'categories'
		| 'priority'
		| 'status'
		| 'effort'
		| 'due'
		| 'tags';

	let open = $state(false);
	let stack = $state<SectionKey[]>([]);
	let direction = $state<'forward' | 'back'>('forward');

	let current = $derived(stack.length > 0 ? stack[stack.length - 1] : null);

	const sections: TodoNavigationSection[] = [
		{
			header: ts.get.todos.priority,
			items: [
				{ filter: { type: 'priority', value: 'high' }, label: ts.get.todos.priority_high },
				{ filter: { type: 'priority', value: 'medium' }, label: ts.get.todos.priority_medium },
				{ filter: { type: 'priority', value: 'low' }, label: ts.get.todos.priority_low }
			]
		},
		{
			header: ts.get.todos.status,
			items: [
				{ filter: { type: 'status', value: 'backlog' }, label: ts.get.todos.status_backlog },
				{ filter: { type: 'status', value: 'pending' }, label: ts.get.todos.status_pending },
				{ filter: { type: 'status', value: 'in-progress' }, label: ts.get.todos.status_in_progress },
				{ filter: { type: 'status', value: 'waiting' }, label: ts.get.todos.status_waiting },
				{ filter: { type: 'status', value: 'almost-done' }, label: ts.get.todos.status_almost_done }
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

	const sectionHeaders: { key: SectionKey; label: string; icon?: any }[] = [
		{ key: 'workspaces', label: ts.get.todos.workspaces },
		{ key: 'categories', label: ts.get.todos.categories },
		{ key: 'priority', label: ts.get.todos.priority },
		{ key: 'status', label: ts.get.todos.status },
		{ key: 'effort', label: ts.get.todos.effort },
		{ key: 'due', label: ts.get.todos.due_at },
		{ key: 'tags', label: ts.get.todos.tags }
	];

	function close(): void {
		open = false;
	}

	function selectSection(key: SectionKey): void {
		direction = 'forward';
		stack = [...stack, key];
	}

	function goBack(): void {
		direction = 'back';
		stack = stack.slice(0, -1);
	}

	function applyFilter(filter: TodoFilter | null): void {
		if (filter) {
			todos.useFilters([filter]);
		} else {
			todos.useFilters([]);
		}
		close();
	}
</script>

<button
	class="absolute top-4 left-4 z-20 cursor-pointer rounded-lg p-3 lg:hidden not-dark:bg-c-neutral-1 hover:bg-c-neutral-2 dark:bg-s-dark-2 dark:hover:bg-s-dark-3"
	onclick={() => (open = true)}
>
	<IconFunnel />
</button>

{#if open}
	<div
		class="fixed inset-0 z-30 flex flex-col bg-c-bg lg:hidden dark:bg-s-dark-1"
		transition:fade={{ duration: 150 }}
	>
		<div class="relative flex-1 overflow-hidden">
			{#key current ?? 'root'}
				<div
					class="absolute inset-0 flex flex-col"
					in:fly={{ x: direction === 'forward' ? window.innerWidth : -window.innerWidth, duration: 250, opacity: 1 }}
					out:fly={{ x: direction === 'forward' ? -window.innerWidth : window.innerWidth, duration: 250, opacity: 1 }}
				>
					{#if current === null}
						<div class="flex shrink-0 items-center justify-between border-b border-c-neutral-2 p-4 dark:border-s-dark-3">
							<span class="text-2xl font-bold">{ts.get.todos.all_todos}</span>
							<CloseButton onClick={close} inModal={false} />
						</div>
						<div class="flex-1 overflow-y-auto">
							<button
								class="flex w-full cursor-pointer items-center justify-between border-b border-c-neutral-1 px-4 py-4 text-left hover:bg-c-neutral-1 dark:border-s-dark-3 dark:hover:bg-s-dark-3"
								onclick={() => applyFilter(null)}
							>
								<span class="text-base">{ts.get.todos.all_todos}</span>
							</button>
							{#each sectionHeaders as section (section.key)}
								<button
									class="flex w-full cursor-pointer items-center justify-between border-b border-c-neutral-1 px-4 py-4 text-left hover:bg-c-neutral-1 dark:border-s-dark-3 dark:hover:bg-s-dark-3"
									onclick={() => selectSection(section.key)}
								>
									<span class="text-base">{section.label}</span>
									<IconChevronRight size={18} class="shrink-0 text-c-neutral-4" />
								</button>
							{/each}
						</div>
					{:else if current === 'workspaces'}
						<div class="flex shrink-0 items-center justify-between border-b border-c-neutral-2 p-4 dark:border-s-dark-3">
							<div class="flex items-center gap-3">
								<button
									class="cursor-pointer text-c-neutral-5 hover:text-c-neutral-7 dark:text-c-neutral-4 dark:hover:text-c-neutral-2"
									onclick={goBack}
								>
									<IconArrowLeft size={22} />
								</button>
								<span class="text-xl font-semibold">{ts.get.todos.workspaces}</span>
							</div>
							<CloseButton onClick={close} inModal={false} />
						</div>
						<div class="flex-1 overflow-y-auto">
							{#each todos.workspaces as workspace (workspace.id)}
								<button
									class="flex w-full cursor-pointer items-center border-b border-c-neutral-1 px-4 py-4 text-left hover:bg-c-neutral-1 dark:border-s-dark-3 dark:hover:bg-s-dark-3 {todos.isFilterActive({ type: 'workspace', value: workspace }) ? 'bg-c-neutral-1 dark:bg-s-dark-3' : ''}"
									onclick={() => { todos.useFilters([{ type: 'workspace', value: workspace }]); close(); }}
								>
									<span class="text-base">{workspace.title}</span>
								</button>
							{/each}
							{#if todos.workspaces.length === 0}
								<div class="px-4 py-8 text-center text-c-neutral-4">{ts.get.todos.no_todos}</div>
							{/if}
						</div>
					{:else if current === 'categories'}
						<div class="flex shrink-0 items-center justify-between border-b border-c-neutral-2 p-4 dark:border-s-dark-3">
							<div class="flex items-center gap-3">
								<button
									class="cursor-pointer text-c-neutral-5 hover:text-c-neutral-7 dark:text-c-neutral-4 dark:hover:text-c-neutral-2"
									onclick={goBack}
								>
									<IconArrowLeft size={22} />
								</button>
								<span class="text-xl font-semibold">{ts.get.todos.categories}</span>
							</div>
							<CloseButton onClick={close} inModal={false} />
						</div>
						<div class="flex-1 overflow-y-auto">
							{#each todos.filteredCategories as category (category.id)}
								<button
									class="flex w-full cursor-pointer items-center border-b border-c-neutral-1 px-4 py-4 text-left hover:bg-c-neutral-1 dark:border-s-dark-3 dark:hover:bg-s-dark-3 {todos.isFilterActive({ type: 'category', value: category.id }) ? 'bg-c-neutral-1 dark:bg-s-dark-3' : ''}"
									onclick={() => { todos.useFilters([{ type: 'category', value: category.id }]); close(); }}
								>
									<span class="text-base">
										{#if category.title.includes('/')}
											<IconSub /> /{category.title.split('/').pop()}
										{:else}
											/{category.title}
										{/if}
									</span>
								</button>
							{/each}
							{#if todos.filteredCategories.length === 0}
								<div class="px-4 py-8 text-center text-c-neutral-4">{ts.get.todos.no_todos}</div>
							{/if}
						</div>
					{:else if current === 'tags'}
						<div class="flex shrink-0 items-center justify-between border-b border-c-neutral-2 p-4 dark:border-s-dark-3">
							<div class="flex items-center gap-3">
								<button
									class="cursor-pointer text-c-neutral-5 hover:text-c-neutral-7 dark:text-c-neutral-4 dark:hover:text-c-neutral-2"
									onclick={goBack}
								>
									<IconArrowLeft size={22} />
								</button>
								<span class="text-xl font-semibold">{ts.get.todos.tags}</span>
							</div>
							<CloseButton onClick={close} inModal={false} />
						</div>
						<div class="flex-1 overflow-y-auto">
							{#each tags.tags as tag (tag.id)}
								<button
									class="flex w-full cursor-pointer items-center border-b border-c-neutral-1 px-4 py-4 text-left hover:bg-c-neutral-1 dark:border-s-dark-3 dark:hover:bg-s-dark-3 {todos.isFilterActive({ type: 'tag', value: tag.id }) ? 'bg-c-neutral-1 dark:bg-s-dark-3' : ''}"
									onclick={() => { todos.useFilters([{ type: 'tag', value: tag.id }]); close(); }}
								>
									<span class="text-base">#{tag.name}</span>
								</button>
							{/each}
							{#if tags.tags.length === 0}
								<div class="px-4 py-8 text-center text-c-neutral-4">{ts.get.todos.no_todos}</div>
							{/if}
						</div>
					{:else}
						{@const section = sections.find((s) => s.header === sectionHeaders.find((h) => h.key === current)?.label)}
						<div class="flex shrink-0 items-center justify-between border-b border-c-neutral-2 p-4 dark:border-s-dark-3">
							<div class="flex items-center gap-3">
								<button
									class="cursor-pointer text-c-neutral-5 hover:text-c-neutral-7 dark:text-c-neutral-4 dark:hover:text-c-neutral-2"
									onclick={goBack}
								>
									<IconArrowLeft size={22} />
								</button>
								<span class="text-xl font-semibold">{section?.header ?? current}</span>
							</div>
							<CloseButton onClick={close} inModal={false} />
						</div>
						<div class="flex-1 overflow-y-auto">
							{#if section}
								{#each section.items as item (item.filter ? item.filter.type + '-' + item.filter.value : item.label)}
									<button
										class="flex w-full cursor-pointer items-center border-b border-c-neutral-1 px-4 py-4 text-left hover:bg-c-neutral-1 dark:border-s-dark-3 dark:hover:bg-s-dark-3 {item.filter && todos.isFilterActive(item.filter) ? 'bg-c-neutral-1 dark:bg-s-dark-3' : ''}"
										onclick={() => { if (item.filter) applyFilter(item.filter); }}
									>
										<span class="text-base">{item.label}</span>
									</button>
								{/each}
							{/if}
						</div>
					{/if}
				</div>
			{/key}
		</div>
	</div>
{/if}
