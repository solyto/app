<script lang="ts">
	let {
		isChecked = $bindable(false),
		onchange,
		disabled = false,
		id,
		ariaLabel,
		size = 'md',
		class: customClass = ''
	}: {
		isChecked?: boolean;
		onchange?: (event: Event) => void;
		disabled?: boolean;
		id?: string;
		ariaLabel?: string;
		// lg sits next to 32px icon buttons (e.g. − / + by a count); the border and shadow make it read larger, so it's a bit smaller.
		size?: 'md' | 'lg';
		class?: string;
	} = $props();
</script>

<div class="inline-flex items-center {customClass}">
	<label class="relative flex items-center" class:cursor-pointer={!disabled} class:cursor-not-allowed={disabled} class:opacity-40={disabled}>
		<input
			type="checkbox"
			{id}
			aria-label={ariaLabel}
			class="checkbox-box peer appearance-none rounded border border-c-neutral-3 bg-c-bg-elevated shadow transition-all checked:border-c-success checked:bg-c-success dark:border-c-neutral-6 dark:checked:border-c-success"
			class:size-5={size === 'md'}
			class:size-7={size === 'lg'}
			class:cursor-pointer={!disabled}
			class:cursor-not-allowed={disabled}
			class:hover:shadow-md={!disabled}
			checked={isChecked}
			{disabled}
			{onchange}
		/>
		<span
			class="checkbox-mark pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-white opacity-0 peer-checked:opacity-100"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class:size-3.5={size === 'md'}
				class:size-4={size === 'lg'}
				viewBox="0 0 20 20"
				fill="currentColor"
				stroke="currentColor"
				stroke-width="1"
			>
				<path
					fill-rule="evenodd"
					d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
					clip-rule="evenodd"
				></path>
			</svg>
		</span>
	</label>
</div>
