<script lang="ts">
	import { getTodos } from '$lib/state/Todos.svelte.js';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import ViewSwitcher from '$lib/components/ui/ViewSwitcher.svelte';
	import { fade } from 'svelte/transition';

	const todos = getTodos();
	const ts = getTranslation();

	let quickCreateOpen = $derived(todos.quickCreateOpen);

	const views = [
		{ type: 'list' as const, title: ts.get.todos.view_list },
		{ type: 'kanban' as const, title: ts.get.todos.view_kanban },
		{ type: 'overview' as const, title: ts.get.todos.view_overview }
	];

	let currentView = $derived(
		quickCreateOpen ? views.find((v) => v.type === todos.view) : null
	);
</script>

<div
	class="absolute top-10 left-8 z-30 hidden 2xl:block"
>
	{#if quickCreateOpen && currentView}
		<div class="transition-opacity duration-150 ease-in-out">
			<ViewSwitcher
				views={[currentView]}
				currentlySelected={todos.view}
				onChange={(type) => todos.changeView(type as any)}
			/>
		</div>
	{:else}
		<div class="transition-opacity duration-150 ease-in-out">
			<ViewSwitcher
				views={views}
				currentlySelected={todos.view}
				onChange={(type) => todos.changeView(type as any)}
			/>
		</div>
	{/if}
</div>
