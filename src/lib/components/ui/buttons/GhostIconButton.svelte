<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		onclick,
		label,
		disabled = false,
		color = 'text-c-neutral-4',
		class: customClass = '',
		children
	}: {
		onclick: () => void;
		label: string;
		disabled?: boolean;
		color?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<button
	type="button"
	class={[
		'flex cursor-pointer items-center justify-center rounded-full p-2 transition-colors hover:bg-c-neutral-1 hover:text-c-primary disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-s-dark-3',
		color,
		customClass
	]}
	title={label}
	aria-label={label}
	{disabled}
	{onclick}
>
	{@render children()}
</button>
