<script lang="ts">
	let { value }: { value: number } = $props();
</script>

<div class="h-4 w-full rounded-lg border-1 border-c-primary shadow-sm">
	<div class="h-full rounded-lg bg-c-primary transition-all duration-1000" style="width: {value * 100}%;"></div>
</div>
