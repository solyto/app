<script lang="ts">
	import Header from '$lib/components/libraries/shared/Header.svelte';
	import { getYoutubeLibrary } from '$lib/state/YoutubeLibrary.svelte';
	import YoutubeCreate from '$lib/components/libraries/youtube/YoutubeCreate.svelte';
	import YoutubeEntries from '$lib/components/libraries/youtube/YoutubeEntries.svelte';
	import CategoryHeader from '$lib/components/libraries/youtube/CategoryHeader.svelte';

	const library = getYoutubeLibrary();
</script>

<div class="h-full max-h-full w-full overflow-y-auto p-4">
	<Header {library} />
	<CategoryHeader />
	{#if library.createModalVisible}
		<YoutubeCreate />
	{/if}
	<YoutubeEntries {library} />
</div>
