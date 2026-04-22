<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { getTags } from '$lib/state/Tags.svelte.js';
	import { onMount } from 'svelte';
	import { getTodos } from '$lib/state/Todos.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import TodoSettings from '$lib/components/settings/TodoSettings.svelte';
	import TagSettings from '$lib/components/settings/TagSettings.svelte';
	import NotificationSettings from '$lib/components/settings/notifications/NotificationSettings.svelte';
	import LocalizationSettings from '$lib/components/settings/LocalizationSettings.svelte';
	import FeatureSettings from '$lib/components/settings/FeatureSettings.svelte';
	import AppSettings from '$lib/components/settings/AppSettings.svelte';
	import ExportSettings from '$lib/components/settings/ExportSettings.svelte';

	const ts = getTranslation();
	const tags = getTags();
	const todos = getTodos();
	const loadingIndicator = getLoadingIndicator();

	onMount(async () => {
		loadingIndicator.start();
		await Promise.all([tags.load(), todos.loadCategories(), todos.loadWorkspaces()]);
		loadingIndicator.stop();
	});
</script>

<div class="p-4 md:p-8">
	<Tabs
		tabs={[
			{ id: 1, title: ts.get.settings.todos, component: TodoSettings },
			{ id: 2, title: ts.get.settings.tags, component: TagSettings },
			{ id: 3, title: ts.get.settings.localization, component: LocalizationSettings },
			{ id: 4, title: ts.get.settings.features, component: FeatureSettings },
			{ id: 5, title: ts.get.settings.notifications, component: NotificationSettings },
		{ id: 6, title: ts.get.settings.app, component: AppSettings },
		{ id: 7, title: ts.get.settings.export_data, component: ExportSettings }
		]}
	/>
</div>
