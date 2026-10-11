<script lang="ts">
	let { title, class: customClass = '' } = $props<{ title: string; class?: string }>();
</script>

<div class="text-base font-bold 2xl:text-2xl 2xl:font-normal {customClass}">
	{title}
</div>
