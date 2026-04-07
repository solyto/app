<script lang="ts">
	import CreateEntry from '$lib/components/settings/CreateEntry.svelte';
	import TagEdit from '$lib/components/tags/TagEdit.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { getTags } from '$lib/state/Tags.svelte.js';
	import Card from '$lib/components/ui/Card.svelte';

	const ts = getTranslation();
	const tags = getTags();
</script>

<div class="md:p-4">
	<Card label={ts.get.settings.tags} hover={false} fixedWidth={true} fullWidth={true}>
		<CreateEntry label={ts.get.settings.new_tag} create={(title) => tags.create(title)} />
		<div class="flex flex-row flex-wrap gap-2 py-4">
			{#each tags.tags as tag (tag.id)}
				<TagEdit {tag} />
			{/each}
		</div>
	</Card>
</div>
