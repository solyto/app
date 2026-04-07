<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';

	let { date = $bindable() }: { date: SvelteDate } = $props();

	const hourOptions = Array.from({ length: 24 }, (_, i) => i + 1).map((i) =>
		(i - 1).toString().padStart(2, '0')
	);
	const minuteOptions = Array.from({ length: 12 }, (_, i) => i).map((i) =>
		(i * 5).toString().padStart(2, '0')
	);
	let hours = $state(date.getHours());
	let minutes = $state(date.getMinutes());
	let hourMenu = $state<boolean>(false);
	let minuteMenu = $state<boolean>(false);

	const setHours = (option: string) => {
		hours = parseInt(option);
		date.setHours(parseInt(option));
	};
	const setMinutes = (option: string) => {
		minutes = parseInt(option);
		date.setMinutes(parseInt(option));
	};
</script>

<div
	class="relative flex w-full items-center justify-center rounded-lg border-1 border-c-neutral-2 bg-c-bg-elevated text-sm shadow-xs transition-all focus:ring-2 focus:ring-c-primary focus:outline-none dark:border-s-dark-2"
>
	<button
		class="w-full cursor-pointer"
		onclick={() => {
			hourMenu = true;
		}}>{hours}</button
	>
	<span>:</span>
	<button
		class="w-full cursor-pointer"
		onclick={() => {
			minuteMenu = true;
		}}>{minutes}</button
	>
	{#if hourMenu || minuteMenu}
		<div
			class="absolute top-10 right-0 z-40 flex max-h-40 w-full flex-col overflow-y-auto rounded-lg bg-c-bg-elevated p-4 shadow-lg"
		>
			{#if hourMenu}
				{#each hourOptions as option (option)}
					<button
						class="flex cursor-pointer items-center justify-center rounded-full text-sm hover:font-bold"
						onclick={() => {
							setHours(option);
							hourMenu = false;
						}}
					>
						{option}
					</button>
				{/each}
			{/if}
			{#if minuteMenu}
				{#each minuteOptions as option (option)}
					<button
						class="flex cursor-pointer items-center justify-center rounded-full text-sm hover:font-bold"
						onclick={() => {
							setMinutes(option);
							minuteMenu = false;
						}}
					>
						{option}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
