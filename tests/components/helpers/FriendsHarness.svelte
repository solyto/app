<script lang="ts">
	import type { AnyComponent } from './context';
	import { setFriends, type Friends } from '$lib/state/Friends.svelte';

	let { component: ComponentToRender, setup = () => {} }: {
		component: AnyComponent;
		setup?: (friends: Friends) => void;
	} = $props();

	const friends = setFriends();
	// svelte-ignore state_referenced_locally
	setup(friends);
</script>

<ComponentToRender />
