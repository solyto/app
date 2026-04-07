<script lang="ts">
	import UiViewSwitcher from '$lib/components/ui/ViewSwitcher.svelte';
	import type { Library } from '$lib/types/library';

	let { library } = $props<{ library: Library }>();

	const baseViews = [
		{ type: 'list' as const, title: 'List' },
		{ type: 'cards' as const, title: 'Cards' }
	];

	const shelfViews = [
		{ type: 'spine' as const, title: 'Shelf' },
		{ type: 'shelf' as const, title: 'Browse' }
	];

	let views = $derived(library.config.hasShelf ? [...baseViews, ...shelfViews] : baseViews);
</script>

<div class="absolute top-0 left-0 hidden 2xl:block">
	<UiViewSwitcher
		{views}
		currentlySelected={library.view}
		onChange={(type) => {
			library.view = type as typeof library.view;
			localStorage.setItem(`solyto_${library.config.type}_view`, type);
		}}
	/>
</div>
