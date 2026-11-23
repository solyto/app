<script lang="ts">
	import type { AnyComponent } from './context';
	import { setClipboard, type Clipboard } from '$lib/state/Clipboard.svelte';

	let { component: ComponentToRender, setup = () => {} }: {
		component: AnyComponent;
		setup?: (clipboard: Clipboard) => void;
	} = $props();

	const clipboard = setClipboard();
	// svelte-ignore state_referenced_locally
	setup(clipboard);
</script>

<ComponentToRender />
