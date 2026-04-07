<script lang="ts">
	import { scale } from 'svelte/transition';
	import Button from '$lib/components/ui/buttons/Button.svelte';

	let {
		hours = $bindable(),
		minutes = $bindable()
	}: {
		hours: number;
		minutes: number;
	} = $props();

	const hourOptions = Array.from({ length: 24 }, (_, i) => i + 1).map((i) =>
		(i - 1).toString().padStart(2, '0')
	);
	const minuteOptions = Array.from({ length: 12 }, (_, i) => i).map((i) =>
		(i * 5).toString().padStart(2, '0')
	);
	let menu = $state<boolean>(false);
</script>

<div
	class="relative flex w-full items-center justify-center gap-1 rounded-lg text-sm transition-all"
>
	<input
		type="number"
		class="w-full rounded-lg border-1 border-c-neutral-2 text-sm shadow-xs transition-all focus:ring-2 focus:ring-d-lightblue focus:outline-none dark:border-s-dark-3 dark:bg-inherit dark:text-white dark:focus:ring-c-primary"
		bind:value={hours}
		onclick={() => {
			menu = true;
		}}
	/>
	<span>:</span>
	<input
		type="number"
		class="w-full rounded-lg border-1 border-c-neutral-2 text-sm shadow-xs transition-all focus:ring-2 focus:ring-d-lightblue focus:outline-none dark:border-s-dark-3 dark:bg-inherit dark:text-white dark:focus:ring-c-primary"
		bind:value={minutes}
		onclick={() => {
			menu = true;
		}}
	/>
	{#if menu}
		<div
			class="absolute top-10 right-0 z-40 flex w-96 items-start gap-16 overflow-y-auto rounded-lg bg-white p-4 text-lg shadow-lg dark:bg-s-dark-3"
			transition:scale
		>
			<div class="grid w-1/2 grid-cols-3 flex-wrap gap-2">
				{#each hourOptions as option (option)}
					<button
						class="cursor-pointer transition-all hover:scale-105 hover:font-bold"
						class:font-bold={hours === parseInt(option)}
						class:scale-125={hours === parseInt(option)}
						onclick={() => (hours = parseInt(option))}
					>
						{option}
					</button>
				{/each}
			</div>
			<div class="grid w-1/2 grid-cols-3 flex-wrap gap-2">
				{#each minuteOptions as option (option)}
					<button
						class="cursor-pointer transition-all hover:scale-105 hover:font-bold"
						class:font-bold={minutes === parseInt(option)}
						class:scale-125={minutes === parseInt(option)}
						onclick={() => (minutes = parseInt(option))}
					>
						{option}
					</button>
				{/each}
				<div class="absolute right-4 bottom-4 cursor-pointer">
					<Button
						title="Set"
						onclick={() => {
							menu = false;
						}}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
