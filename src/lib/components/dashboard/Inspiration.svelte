<script lang="ts">
	import type { Link } from '$lib/types/library_link';
	import type { Quote } from '$lib/types/library_quote';
	import type { MusicRelease } from '$lib/types/library_music';
	import type { BookRelease } from '$lib/types/library_book';
	import type { Note } from '$lib/types/note';
	import { onMount } from 'svelte';
	import { blur } from 'svelte/transition';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import ApiService from '$lib/services/ApiService';
	import { apiRoutes } from '$lib/config/apiRoutes';
	import { nl2br } from '$lib/helpers/FormatHelper';
	import { formatDate } from '$lib/helpers/DateHelper';
	import DOMPurify from 'dompurify';
	import IconQuote from '@lucide/svelte/icons/quote';
	import IconDisc3 from '@lucide/svelte/icons/disc-3';
	import IconBookOpen from '@lucide/svelte/icons/book-open';
	import IconNotebookPen from '@lucide/svelte/icons/notebook-pen';
	import IconLink from '@lucide/svelte/icons/link';
	import IconExternalLink from '@lucide/svelte/icons/external-link';

	const auth = getAuth();
	const ts = getTranslation();
	const apiService = new ApiService(auth.getToken());

	let quote = $state<Quote | null>(null);
	let musicReleases = $state<MusicRelease[]>([]);
	let bookReleases = $state<BookRelease[]>([]);
	let newestNotes = $state<Note[]>([]);
	let newestLinks = $state<Link[]>([]);
	let loadedCount = $state(0);

	let isEmpty = $derived(
		loadedCount >= 5 &&
			musicReleases.length === 0 &&
			bookReleases.length === 0 &&
			newestNotes.length === 0 &&
			newestLinks.length === 0 &&
			!quote
	);

	onMount(() => {
		apiService.get(apiRoutes.libraries.quotes.getRandom, null).then((res) => {
			if (res) quote = res.data as Quote;
			loadedCount++;
		});
		apiService.list(apiRoutes.libraries.music.releases).then((res) => {
			if (res) musicReleases = (res.data as MusicRelease[]).slice(0, 5);
			loadedCount++;
		});
		apiService.list(apiRoutes.libraries.books.releases).then((res) => {
			if (res) bookReleases = (res.data as BookRelease[]).slice(0, 5);
			loadedCount++;
		});
		apiService.list(apiRoutes.notes.list).then((res) => {
			if (res) {
				newestNotes = (res.data as Note[])
					.sort((a, b) => {
						const aTime = Math.max(new Date(a.created_at).getTime(), new Date(a.updated_at).getTime());
						const bTime = Math.max(new Date(b.created_at).getTime(), new Date(b.updated_at).getTime());
						return bTime - aTime;
					})
					.slice(0, 5);
			}
			loadedCount++;
		});
		apiService.list(apiRoutes.libraries.links.newest).then((res) => {
			if (res) newestLinks = res.data as Link[];
			loadedCount++;
		});
	});
</script>

<div class="flex flex-col gap-12">
	{#if musicReleases.length > 0}
		<div in:blur>
			<div class="mb-3 flex items-center gap-2">
				<IconDisc3 size={15} class="text-c-heading dark:text-c-primary" />
				<span
					class="text-xs font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary"
				>
					{ts.get.home.new_music}
				</span>
			</div>
			<div class="flex flex-col gap-2.5">
				{#each musicReleases as release (release.id)}
					<a
						href={release.url}
						target="_blank"
						rel="noopener noreferrer"
						class="group flex items-center gap-3 transition-colors"
					>
						{#if release.cover}
							<img
								src={release.cover}
								alt={release.title}
								class="h-9 w-9 shrink-0 rounded object-cover"
							/>
						{:else}
							<div
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-c-neutral-1 dark:bg-s-dark-3"
							>
								<IconDisc3 size={14} class="text-c-neutral-4" />
							</div>
						{/if}
						<div class="flex min-w-0 flex-col">
							<span
								class="truncate text-sm font-medium text-c-neutral-8 transition-colors group-hover:text-c-primary dark:text-white dark:group-hover:text-c-primary"
							>
								{release.title}
							</span>
							<span class="truncate text-xs text-c-neutral-5 dark:text-c-neutral-4">
								{release.artist} &middot; {formatDate(release.release_date)}
							</span>
						</div>
						<IconExternalLink
							size={13}
							class="ml-auto shrink-0 text-c-neutral-4 opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	{#if bookReleases.length > 0}
		<div in:blur>
			<div class="mb-3 flex items-center gap-2">
				<IconBookOpen size={15} class="text-c-heading dark:text-c-primary" />
				<span
					class="text-xs font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary"
				>
					{ts.get.home.new_books}
				</span>
			</div>
			<div class="flex flex-col gap-2.5">
				{#each bookReleases as release (release.id)}
					<a
						href={release.url}
						target="_blank"
						rel="noopener noreferrer"
						class="group flex items-center gap-3 transition-colors"
					>
						{#if release.cover}
							<img
								src={release.cover}
								alt={release.title}
								class="h-9 w-9 shrink-0 rounded object-cover"
							/>
						{:else}
							<div
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-c-neutral-1 dark:bg-s-dark-3"
							>
								<IconBookOpen size={14} class="text-c-neutral-4" />
							</div>
						{/if}
						<div class="flex min-w-0 flex-col">
							<span
								class="truncate text-sm font-medium text-c-neutral-8 transition-colors group-hover:text-c-primary dark:text-white dark:group-hover:text-c-primary"
							>
								{release.title}
							</span>
							<span class="truncate text-xs text-c-neutral-5 dark:text-c-neutral-4">
								{release.author} &middot; {formatDate(release.release_date)}
							</span>
						</div>
						<IconExternalLink
							size={13}
							class="ml-auto shrink-0 text-c-neutral-4 opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	{#if newestNotes.length > 0}
		<div in:blur>
			<div class="mb-2 flex items-center gap-2">
				<IconNotebookPen size={15} class="text-c-heading dark:text-c-primary" />
				<span
					class="text-xs font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary"
				>
					{ts.get.home.recent_notes}
				</span>
			</div>
			<div class="flex flex-col gap-1">
				{#each newestNotes as note (note.id)}
					<a
						href="/notes/{note.id}"
						class="group flex items-center gap-2 py-0.5 transition-colors"
					>
						<span
							class="truncate text-sm text-c-neutral-7 transition-colors group-hover:text-c-primary dark:text-c-neutral-3"
						>
							{note.title}
						</span>
						<span class="ml-auto shrink-0 text-xs text-c-neutral-4 dark:text-c-neutral-5">
							{formatDate(new Date(note.updated_at) > new Date(note.created_at) ? note.updated_at : note.created_at)}
						</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	{#if newestLinks.length > 0}
		<div in:blur>
			<div class="mb-2 flex items-center gap-2">
				<IconLink size={15} class="text-c-heading dark:text-c-primary" />
				<span
					class="text-xs font-semibold tracking-wider text-c-heading uppercase dark:text-c-primary"
				>
					{ts.get.home.newest_links}
				</span>
			</div>
			<div class="flex flex-col gap-1">
				{#each newestLinks as link}
					<a
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						class="group flex items-center gap-2 py-0.5 transition-colors"
					>
						<span
							class="truncate text-sm text-c-neutral-7 transition-colors group-hover:text-c-primary dark:text-c-neutral-3"
						>
							{link.title}
						</span>
						<IconExternalLink
							size={12}
							class="ml-auto shrink-0 text-c-neutral-4 opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	{#if quote}
		<div class="flex items-start gap-3" in:blur>
			<IconQuote size={15} class="mt-0.5 shrink-0 text-c-heading dark:text-c-primary" />
			<div class="flex flex-col gap-1.5">
				<p class="text-sm leading-relaxed text-c-neutral-7 dark:text-c-neutral-3">
					{@html DOMPurify.sanitize(nl2br(quote.quote))}
				</p>
				{#if quote.author}
					<span class="text-xs font-medium text-c-heading dark:text-c-primary">
						{quote.author}
					</span>
				{/if}
			</div>
		</div>
	{/if}

	{#if isEmpty}
		<div class="flex flex-col gap-3" in:blur>
			<p class="text-sm text-c-neutral-4 dark:text-c-neutral-5">{ts.get.home.inspiration_empty_hint}</p>
			<div class="flex flex-wrap gap-3">
				<a
					href="/notes"
					class="text-xs text-c-primary transition-colors hover:text-c-primary/70"
				>
					{ts.get.nav.notes} →
				</a>
				<a
					href="/libraries"
					class="text-xs text-c-primary transition-colors hover:text-c-primary/70"
				>
					{ts.get.nav.libraries} →
				</a>
			</div>
		</div>
	{/if}
</div>
