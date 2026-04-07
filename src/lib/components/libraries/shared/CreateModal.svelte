<script lang="ts">
	import { fade } from 'svelte/transition';
	import MissingCover from '$lib/components/libraries/shared/MissingCover.svelte';
	import Rating from '$lib/components/libraries/shared/Rating.svelte';
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import Checkbox from '$lib/components/forms/Checkbox.svelte';
	import type { Library } from '$lib/types/library';
	import { getTranslation } from '$lib/state/Translation.svelte';

	const ts = getTranslation();

	let {
		title,
		library,
		children,
		existingCover,
		newCover,
		selectedRating = $bindable(),
		isWishlist = $bindable()
	} = $props<{
		title: string;
		library: Library;
		children: any;
		existingCover?: string | null;
		newCover?: string;
		selectedRating?: number | null;
		isWishlist?: boolean;
	}>();
</script>

<ContentModal rounded="2xl" p="8" onClose={() => library.closeCreateModal()} {title}>
	<div class="flex flex-col gap-8 overflow-x-hidden md:flex-row">
		{#if library.config.hasCovers || library.config.hasRatings || library.config.hasWishlist}
			<div class="flex flex-col items-center gap-2">
				{#if library.config.hasCovers}
					<div class="aspect-ratio max-w-48">
						{#if existingCover}
							<div
								class="flex size-48 items-center justify-center rounded-lg bg-c-neutral-2 dark:bg-c-neutral-5"
							>
								<img
									src={existingCover}
									alt="Cover"
									class="max-h-full max-w-full rounded-lg object-contain"
									transition:fade={{ duration: 200 }}
								/>
							</div>
						{:else if newCover}
							<img
								src={newCover}
								alt="cover"
								class="max-h-full max-w-full rounded-lg object-contain"
								transition:fade={{ duration: 200 }}
							/>
						{:else}
							<div
								class="relative flex size-48 items-center justify-center rounded-lg bg-c-neutral-2 text-xs text-c-neutral-5"
							>
								<MissingCover {library} />
							</div>
						{/if}
					</div>
				{/if}
				{#if library.config.hasRatings}
					<Rating
						startRating={selectedRating}
						onchange={(rating: number) => {
							selectedRating = rating;
						}}
					/>
				{/if}
				{#if library.config.hasWishlist}
					<div class="mt-4 flex w-8/10 flex-row items-center gap-2">
						<span class="w-48 text-sm font-bold">{ts.get.libraries.wishlist}</span>
						<Checkbox
							isChecked={isWishlist}
							onchange={() => {
								isWishlist = !isWishlist;
							}}
						/>
					</div>
				{/if}
			</div>
		{/if}
		<div class="flex flex-1 flex-col gap-2 md:min-w-96">
			{@render children()}
		</div>
	</div>
</ContentModal>
