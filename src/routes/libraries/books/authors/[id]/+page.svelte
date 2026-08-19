<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconUser from '@lucide/svelte/icons/user';
	import IconPlus from '@lucide/svelte/icons/plus';
	import { getBookLibrary } from '$lib/state/BookLibrary.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { urls } from '$lib/config/urls';
	import { API_USER_STORAGE_URL } from '$lib/config/apiRoutes';
	import { resizeImage } from '$lib/services/ImageService';
	import type { Author, Book } from '$lib/types/library_book';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import NumberInput from '$lib/components/forms/NumberInput.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import StarButton from '$lib/components/ui/buttons/StarButton.svelte';
	import InlineDeleteButton from '$lib/components/ui/buttons/InlineDeleteButton.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';

	const library = getBookLibrary();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();
	const auth = getAuth();

	let deleteModal = $state<boolean>(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let author = $state<Author | null>(null);
	let notFound = $state<boolean>(false);

	let nameValue = $state<string>('');
	let bioValue = $state<string>('');
	let hardcoverIdValue = $state<number | null>(null);

	function applyAuthor(loaded: Author): void {
		author = loaded;
		nameValue = loaded.name;
		bioValue = loaded.bio ?? '';
		hardcoverIdValue = loaded.hardcover_id;
	}

	async function refresh(): Promise<void> {
		const result = await library.loadAuthor(Number(page.params.id));
		if (result) {
			applyAuthor(result);
		} else {
			notFound = true;
		}
	}

	onMount(async () => {
		loadingIndicator.start();
		await refresh();
		loadingIndicator.stop();
	});

	$effect(() => {
		if (notFound) {
			goto(resolve(urls.bookLibrary));
		}
	});

	async function save(): Promise<void> {
		if (!author || nameValue.trim() === '') return;

		loadingIndicator.start();
		const ok = await library.updateAuthor(author, {
			name: nameValue.trim(),
			bio: bioValue.trim() !== '' ? bioValue.trim() : null,
			hardcover_id: hardcoverIdValue
		});
		if (ok) {
			await refresh();
		} else {
			notifications.error(ts.get.libraries.books.author_update_error);
		}
		loadingIndicator.stop();
	}

	async function toggleFavorite(): Promise<void> {
		if (!author) return;
		loadingIndicator.start();
		await library.toggleAuthorFavorite(author);
		await refresh();
		loadingIndicator.stop();
	}

	async function onFileSelected(event: Event): Promise<void> {
		if (!author) return;

		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		loadingIndicator.start();
		const resized = await resizeImage(file);
		const ok = await library.uploadAuthorPhoto(author, resized);
		if (ok) {
			await refresh();
		} else {
			notifications.error(ts.get.libraries.books.author_photo_error);
		}
		loadingIndicator.stop();
		input.value = '';
	}

	async function resync(): Promise<void> {
		if (!author) return;
		loadingIndicator.start();
		const synced = await library.resyncAuthorFromHardcover(author);
		if (synced) {
			await refresh();
			notifications.success(ts.get.libraries.books.author_resync_success);
		} else {
			notifications.error(ts.get.libraries.books.author_resync_error);
		}
		loadingIndicator.stop();
	}

	async function unlink(book: Book): Promise<void> {
		loadingIndicator.start();
		const ok = await library.unlinkBook(book);
		if (ok) {
			await refresh();
		} else {
			notifications.error(ts.get.libraries.books.author_unlink_error);
		}
		loadingIndicator.stop();
	}

	async function onDelete(): Promise<void> {
		if (!author) return;
		loadingIndicator.start();
		await library.deleteAuthor(author);
		loadingIndicator.stop();
		await goto(resolve(urls.bookLibrary));
	}
</script>

{#if deleteModal && author}
	<ConfirmationModal
		title={ts.get.libraries.books.author_delete_confirm_title}
		description={ts.get.libraries.books.author_delete_confirm_description}
		type="confirm-delete"
		onConfirm={onDelete}
		onCancel={() => (deleteModal = false)}
	/>
{/if}

{#if author}
	<input
		bind:this={fileInput}
		type="file"
		accept="image/jpeg,image/png,image/gif,image/webp"
		class="hidden"
		onchange={onFileSelected}
	/>

	<div class="flex h-full flex-1 flex-col" in:fade>
		<div
			class="flex-shrink-0 border-b border-c-neutral-1 bg-white/80 px-4 py-4 backdrop-blur-sm lg:px-8 dark:border-s-dark-3 dark:bg-s-dark/80"
		>
			<div class="flex flex-row items-center gap-4">
				<a
					href={resolve(urls.bookLibrary)}
					class="flex size-9 items-center justify-center rounded-lg text-c-neutral-4 transition-all hover:bg-c-neutral-1 hover:text-c-neutral-6 lg:hidden dark:hover:bg-s-dark-3 dark:hover:text-white"
				>
					<IconArrowLeft class="size-5" />
				</a>
				<span class="flex-1 text-lg font-bold text-c-heading dark:text-c-primary">
					{author.name}
				</span>
				<StarButton onClick={toggleFavorite} selected={author.is_favorite} />
				<InlineDeleteButton
					onClick={() => {
						deleteModal = true;
					}}
				/>
			</div>
		</div>

		<div class="flex flex-col gap-6 overflow-y-auto p-4 lg:px-8">
			<div class="flex flex-col gap-6 md:flex-row">
				<div class="flex flex-col items-center gap-2">
					<button
						type="button"
						onclick={() => fileInput?.click()}
						class="group relative size-32 rounded-full border-2 border-c-neutral-1 transition-all hover:border-c-btn-hover dark:border-s-dark-3"
					>
						{#if author.photo}
							<img
								src={`${API_USER_STORAGE_URL}/${auth.user?.id}/authors/${author.photo}`}
								alt={author.name}
								class="h-full w-full rounded-full object-cover"
							/>
						{:else}
							<div
								class="flex h-full w-full items-center justify-center rounded-full bg-c-neutral-2 dark:bg-s-dark-2"
							>
								<IconUser class="size-14 text-c-neutral-4" />
							</div>
						{/if}
						<div
							class="absolute top-0 left-0 flex h-full w-full items-center justify-center bg-transparent text-c-btn-hover opacity-0 transition-opacity group-hover:opacity-100"
						>
							<IconPlus class="size-10" />
						</div>
					</button>
				</div>

				<div class="flex flex-1 flex-col gap-2 md:max-w-md">
					<ModalFormRow label={ts.get.libraries.books.author_name}>
						<TextInput bind:value={nameValue} />
					</ModalFormRow>
					<ModalFormRow label={ts.get.libraries.books.author_bio}>
						<TextInput bind:value={bioValue} multiLine height={100} />
					</ModalFormRow>
					<ModalFormRow label={ts.get.libraries.books.author_hardcover_id}>
						<NumberInput bind:value={hardcoverIdValue} />
					</ModalFormRow>
					<div class="mt-4 flex flex-row items-center justify-end gap-3">
						{#if author.hardcover_id && hardcoverIdValue === author.hardcover_id}
							<TextButton
								title={ts.get.libraries.books.author_resync}
								type="slight"
								onclick={resync}
							/>
						{/if}
						<TextButton title={ts.get.layout.save} onclick={save} />
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<span class="text-sm font-bold text-c-neutral-5 dark:text-c-neutral-4">
					{ts.get.libraries.books.author_books} ({author.books?.length ?? 0})
				</span>
				{#if !author.books || author.books.length === 0}
					<p class="text-c-neutral-5 dark:text-c-neutral-4">
						{ts.get.libraries.books.author_no_books}
					</p>
				{:else}
					<div class="flex flex-col gap-2">
						{#each author.books as book (book.id)}
							<div
								class="flex flex-row items-center justify-between gap-2 rounded-md bg-white p-3 shadow-sm dark:bg-s-dark-2"
							>
								<span class="font-bold">{book.title}</span>
								<TextButton
									title={ts.get.libraries.books.author_unlink}
									type="slight"
									onclick={() => unlink(book)}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
