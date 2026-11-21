<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		onclick,
		label,
		color = 'text-c-neutral-4',
		class: customClass = '',
		children
	}: {
		onclick: () => void;
		label: string;
		color?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<button
	type="button"
	class={[
		'flex cursor-pointer items-center justify-center rounded-full p-2 transition-colors hover:bg-c-neutral-1 hover:text-c-primary dark:hover:bg-s-dark-3',
		color,
		customClass
	]}
	title={label}
	aria-label={label}
	{onclick}
>
	{@render children()}
</button>
