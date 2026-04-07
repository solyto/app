<script lang="ts">
	let {
		children,
		onclick = () => {},
		class: customClass = ''
	} = $props<{
		children: any;
		onclick?: () => void;
		class?: string;
	}>();
</script>

<button
	class="flex cursor-pointer items-center justify-center rounded-sm bg-c-action px-4 py-2 font-bold transition-all hover:bg-c-warning hover:shadow-xs {customClass}"
	{onclick}
>
	{@render children()}
</button>
