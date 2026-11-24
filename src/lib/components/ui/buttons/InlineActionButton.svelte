<script lang="ts">
	import type { Component } from 'svelte';

	let { onClick, label = null, icon: Icon, color, fill, class: customClass = '' }: {
		onClick: (e: MouseEvent) => void | Promise<void>;
		label?: string | null;
		icon: Component<{ class?: string }>;
		color: string;
		fill: string;
		class?: string;
	} = $props();
</script>

<div
	class="group relative z-40 flex size-[34px] cursor-pointer items-center justify-center rounded-full border-c-neutral-3 {color} drop-shadow-md transition-all hover:drop-shadow-xl {customClass}"
>
	<button
		type="button"
		aria-label={label ?? undefined}
		title={label ?? undefined}
		class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full {fill} text-white opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100 hover:shadow-sm"
		onclick={onClick}
	>
		<Icon class="size-5" />
	</button>
	<Icon class="size-5" />
</div>
