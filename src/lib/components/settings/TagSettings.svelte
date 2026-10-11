<script lang="ts">
	import CreateEntry from '$lib/components/settings/CreateEntry.svelte';
	import TagEdit from '$lib/components/settings/TagEdit.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getTags } from '$lib/state/Tags.svelte';

	const ts = getTranslation();
	const tags = getTags();
</script>

<div class="absolute top-0 right-0 flex h-8 items-center">
	<CreateEntry
		label={ts.get.settings.new_tag}
		create={(title) => tags.create(title)}
		useAddButton={true}
	/>
</div>
<div class="flex flex-row flex-wrap gap-2">
	{#each tags.tags as tag (tag.id)}
		<TagEdit {tag} />
	{/each}
</div>
