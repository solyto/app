<script lang="ts">
	import { scale } from 'svelte/transition';

	let { src, alt = '', class: customClass = '' } = $props<{
		src: string;
		alt?: string;
		class?: string;
	}>();

	let loaded = $state(false);

	$effect(() => {
		loaded = false;
		const img = new Image();
		img.onload = () => (loaded = true);
		img.src = src;
	});
</script>

{#if loaded}
	<img {src} {alt} class={customClass} in:scale />
{/if}
