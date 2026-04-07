<script lang="ts">
	import CreateEntry from '$lib/components/settings/CreateEntry.svelte';
	import WorkspaceEdit from '$lib/components/todos/actions/WorkspaceEdit.svelte';
	import CategoryEdit from '$lib/components/todos/actions/CategoryEdit.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getTodos } from '$lib/state/Todos.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	const ts = getTranslation();
	const todos = getTodos();
</script>

<div class="flex flex-col gap-8 md:p-4">
	<Card label={ts.get.settings.categories} hover={false} fixedWidth={true} fullWidth={true}>
		<CreateEntry
			label={ts.get.settings.new_category}
			create={(title) => todos.createCategory(title)}
		/>
		<div class="flex flex-row flex-wrap gap-2 py-4">
			{#each todos.categories as category (category.id)}
				<CategoryEdit {category} />
			{/each}
		</div>
	</Card>
	<Card label={ts.get.settings.workspaces} hover={false} fixedWidth={true} fullWidth={true}>
		<CreateEntry
			label={ts.get.settings.new_workspace}
			create={(title) => todos.createWorkspace(title)}
		/>
		<div class="flex flex-row flex-wrap gap-2 py-4">
			{#each todos.workspaces as workspace (workspace.id)}
				<WorkspaceEdit {workspace} />
			{/each}
		</div>
	</Card>
</div>
