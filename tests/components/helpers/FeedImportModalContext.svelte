<script lang="ts">
	import { setFeeds } from '$lib/state/Feeds.svelte';
	import { setFeedImport } from '$lib/state/FeedImport.svelte';
	import FeedImportModal from '$lib/components/feeds/FeedImportModal.svelte';

	setFeeds();
	setFeedImport();
</script>

<FeedImportModal />
