<script lang="ts">
	import { clickOutside } from '$lib/helpers/ClickHelper';
	import { fade } from 'svelte/transition';

	let { onClose, children, class: className = '' } = $props<{
		onClose: () => void;
		children?: any;
		class?: string;
	}>();
</script>

<div
	use:clickOutside={onClose}
	transition:fade={{ duration: 200 }}
	class="absolute top-0 z-30 flex flex-col gap-2 rounded-lg bg-white p-4 drop-shadow-lg dark:bg-s-dark-2 {className}"
>
	{@render children?.()}
</div>
