<script lang="ts">
	import Header from '$lib/components/libraries/shared/Header.svelte';
	import { getVideoLibrary } from '$lib/state/VideoLibrary.svelte';
	import VideoCreate from '$lib/components/libraries/videos/VideoCreate.svelte';
	import VideoEntries from '$lib/components/libraries/videos/VideoEntries.svelte';
	import CategoryHeader from '$lib/components/libraries/videos/CategoryHeader.svelte';

	const library = getVideoLibrary();
</script>

<div class="h-full max-h-full w-full overflow-y-auto p-4">
	<Header {library} />
	<CategoryHeader />
	{#if library.createModalVisible}
		<VideoCreate />
	{/if}
	<VideoEntries {library} />
</div>
