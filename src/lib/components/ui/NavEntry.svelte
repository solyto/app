<script lang="ts">
	import { slide } from 'svelte/transition';

	let {
		slug,
		title,
		href,
		onSelect,
		active = false,
		children,
		mobile = false,
		fixedWidth = false,
		dataTour = undefined
	} = $props<{
		slug: string;
		title: string;
		href: string;
		onSelect: (slug: string) => void;
		active?: boolean;
		children?: any;
		mobile?: boolean;
		fixedWidth?: boolean;
		dataTour?: string;
	}>();
</script>

<a
	class="flex items-center justify-center rounded-sm transition-all md:max-h-[5vh]"
	class:w-full={!fixedWidth}
	class:w-14={fixedWidth}
	class:h-14={!mobile}
	class:h-12={mobile}
	{href}
	{title}
	data-tour={dataTour}
	class:bg-c-nav-active={active}
	class:hover:bg-c-nav-hover={!mobile && !active}
	class:text-c-nav-active-text={active}
	onclick={() => onSelect(slug)}
	transition:slide
>
	{@render children?.()}
</a>

<!-- w-14 h-14 -->
