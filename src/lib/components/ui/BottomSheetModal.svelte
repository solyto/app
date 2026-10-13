<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { getViewPoint } from '$lib/state/Viewpoint.svelte';
	import CloseButton from '$lib/components/ui/buttons/CloseButton.svelte';
	import DeleteButton from '$lib/components/ui/buttons/DeleteButton.svelte';
	import AcceptButton from '$lib/components/ui/buttons/AcceptButton.svelte';

	const viewPoint = getViewPoint();

	let {
		onClose,
		onDelete,
		onComplete,
		children,
		title = null
	} = $props<{
		onClose?: () => void | Promise<void>;
		onDelete?: () => void | Promise<void>;
		onComplete?: (event?: MouseEvent) => void | Promise<void>;
		children?: Snippet;
		title?: string | null;
	}>();
</script>

<div
	class="fixed top-0 left-0 z-40 flex h-dvh w-screen items-end bg-transparent backdrop-blur-xs modal-blur pb-16 2xl:pb-0"
	style:padding-bottom={viewPoint.keyboardHeight ? `${viewPoint.keyboardHeight}px` : ''}
	in:fly|global={{ y: 400, duration: 350 }}
	out:fly|global={{ y: 400, duration: 250 }}
>
	<div
		class="relative w-full"
	>
		{#if onClose}
			<CloseButton onClick={onClose} />
		{/if}
		{#if onComplete}
			<div class="absolute top-20 right-4 z-40">
				<AcceptButton onClick={onComplete} />
			</div>
		{/if}
		{#if onDelete}
			<div class="absolute top-32 right-4 z-40">
				<DeleteButton onClick={onDelete} inModal={false} />
			</div>
		{/if}
		<div class="relative z-30 w-full overflow-y-auto rounded-t-2xl bg-c-bg-modal p-6 shadow-md not-dark:border-t-1 not-dark:border-c-neutral-2 dark:shadow-s-dark-shadow max-h-[calc(100dvh-4rem)]">
			{#if title}
				<p class="mb-4 text-xl font-bold text-c-heading dark:text-c-primary">{title}</p>
			{/if}
			{@render children?.()}
		</div>
	</div>
</div>
