<script lang="ts">
	import IconAlignJustify from '@lucide/svelte/icons/align-justify';
	import IconList from '@lucide/svelte/icons/list';
	import IconGrid2x2 from '@lucide/svelte/icons/grid-2x2';
	import IconSquareKanban from '@lucide/svelte/icons/square-kanban';
	import IconLayoutGrid from '@lucide/svelte/icons/layout-grid';
	import IconGalleryHorizontal from '@lucide/svelte/icons/gallery-horizontal';
	import IconLibrary from '@lucide/svelte/icons/library';

	let {
		views,
		currentlySelected,
		onChange,
		class: className = ''
	} = $props<{
		views: Array<{
			type: 'compact' | 'comfortable' | 'card' | 'list' | 'kanban' | 'overview' | 'shelf' | 'cards' | 'spine';
			title: string;
		}>;
		currentlySelected: string;
		onChange: (type: string) => void;
		class?: string;
	}>();
</script>

<div class="flex items-center gap-1 {className}">
	{#each views as view (view.type)}
		<button
			class="cursor-pointer rounded-lg p-2 transition-all hover:bg-c-neutral-1 dark:hover:bg-s-dark-3"
			class:bg-c-neutral-1={view.type === currentlySelected}
			class:dark:bg-s-dark-3={view.type === currentlySelected}
			onclick={() => onChange(view.type)}
			title={view.title}
		>
			{#if view.type === 'compact'}
				<IconAlignJustify class="size-4" />
			{:else if view.type === 'comfortable'}
				<IconList class="size-4" />
			{:else if view.type === 'card'}
				<IconGrid2x2 class="size-4" />
			{:else if view.type === 'list'}
				<IconAlignJustify class="size-4" />
			{:else if view.type === 'kanban'}
				<IconSquareKanban class="size-4" />
			{:else if view.type === 'cards'}
				<IconGrid2x2 class="size-4" />
			{:else if view.type === 'overview'}
				<IconLayoutGrid class="size-4" />
			{:else if view.type === 'shelf'}
				<IconGalleryHorizontal class="size-4" />
			{:else if view.type === 'spine'}
				<IconLibrary class="size-4" />
			{/if}
		</button>
	{/each}
</div>
