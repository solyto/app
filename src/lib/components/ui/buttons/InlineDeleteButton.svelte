<script lang="ts">
	import IconTrash from '@lucide/svelte/icons/trash-2';

	let { onClick } = $props<{
		onClick: (e: MouseEvent) => void | Promise<void>;
	}>();
</script>

<div
	class="group relative z-40 flex size-[34px] cursor-pointer items-center justify-center rounded-full border-c-neutral-3 text-c-danger drop-shadow-md transition-all hover:drop-shadow-xl"
>
	<button
		class="absolute flex h-0 w-0 cursor-pointer items-center justify-center rounded-full bg-c-danger text-white transition-all group-hover:h-full group-hover:w-full hover:shadow-sm"
		onclick={onClick}
	>
		<IconTrash class="size-5" />
	</button>
	<IconTrash class="size-5" />
</div>
