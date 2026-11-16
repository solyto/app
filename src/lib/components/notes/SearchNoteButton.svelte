<script lang="ts">
	import IconSearch from '@lucide/svelte/icons/search';

	let { onClick }: {
		onClick: () => void;
	} = $props();
</script>

<button
	class="z-40 cursor-pointer rounded-full bg-c-btn p-[7px] text-white drop-shadow-md transition-all hover:text-c-heading hover:drop-shadow-xl"
	onclick={onClick}
>
	<IconSearch class="size-5" />
</button>
