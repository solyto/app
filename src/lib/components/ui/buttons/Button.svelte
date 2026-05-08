<script lang="ts">
	let {
		title,
		onclick = () => {},
		href = null,
		type = 'primary',
		align = 'center',
		disabled = false,
		class: customClass = ''
	} = $props<{
		title: string;
		onclick?: () => void;
		href?: string | null;
		type?: 'primary' | 'action' | 'error' | 'plain' | 'slight';
		align?: 'left' | 'center' | 'right';
		disabled?: boolean;
		class?: string;
	}>();
</script>

{#if href === null}
	<button
		class="rounded-sm p-1 font-bold transition-all {customClass}"
		class:cursor-pointer={!disabled}
		class:cursor-not-allowed={disabled}
		class:opacity-40={disabled}
		class:hover:shadow-xs={!disabled}
		class:bg-c-btn={type === 'primary'}
		class:hover:bg-c-btn-hover={type === 'primary' && !disabled}
		class:bg-c-action={type === 'action'}
		class:hover:bg-c-warning={type === 'action' && !disabled}
		class:bg-c-danger={type === 'error'}
		class:hover:bg-c-danger-hover={type === 'error' && !disabled}
		class:bg-c-neutral-1={type === 'slight'}
		class:hover-bg-c-neutral-3={type === 'slight'}
		class:dark:bg-s-dark-3={type === 'slight'}
		class:dark:hover:bg-s-dark-2={type === 'slight' && !disabled}
		class:dark:text-white={type === 'slight'}
		class:text-c-neutral-7={type === 'slight'}
		class:text-c-btn-text={type !== 'plain' && type !== 'slight'}
		class:hover:text-white={type !== 'plain' && type !== 'slight' && !disabled}
		class:text-left={align === 'left'}
		class:text-right={align === 'right'}
		class:px-4={type !== 'plain'}
		class:py-2={type !== 'plain'}
		{disabled}
		{onclick}
	>
		{title}
	</button>
{:else}
	<a
		{href}
		class="cursor-pointer rounded-sm p-1 transition-all hover:shadow-xs {customClass}"
		class:bg-c-btn={type === 'primary'}
		class:hover:bg-c-btn-hover={type === 'primary'}
		class:bg-c-danger={type === 'error'}
		class:hover:bg-c-danger-hover={type === 'error'}
		class:text-c-neutral={type !== 'plain'}
		class:hover:text-white={type !== 'plain'}
		class:text-center={align === 'center'}
		class:text-left={align === 'left'}
		class:text-right={align === 'right'}
		class:px-4={type !== 'plain'}
		class:py-2={type !== 'plain'}
	>
		{title}
	</a>
{/if}

<!-- bg-c-action -->
