<script lang="ts">
	import SubHeading from '$lib/components/ui/SubHeading.svelte';

	let {
		label,
		children,
		headerAction = null
	} = $props<{
		label: string;
		children?: any;
		headerAction?: any;
	}>();
</script>

<div class="w-full">
	<div class="mb-4 flex items-center justify-between">
		<SubHeading title={label} my={0} />
		{#if headerAction !== null}
			{@render headerAction()}
		{/if}
	</div>
	{#if children !== undefined}
		{@render children()}
	{/if}
</div>
