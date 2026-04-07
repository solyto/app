<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { urls } from '$lib/config/urls';
	import { getAuth } from '$lib/state/Auth.svelte.js';
	import { resolve } from '$app/paths';
	import StaggeredLogo from '$lib/components/ui/StaggeredLogo.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { scale } from 'svelte/transition';
	import Button from '$lib/components/ui/buttons/Button.svelte';

	const auth = getAuth();
	const ts = getTranslation();
	const userId = page.params.user_id;
	const token = page.params.token;
	let loaded = $state<boolean>(false);
	let status = $state<boolean>(false);
	let errors = $state<string[]>([]);

	onMount(async () => {
		if (!userId || !token) {
			await goto(resolve(urls.login));
		}

		const verification = await auth.verify({
			user_id: userId,
			token: token
		});
		status = verification.success;
		errors = verification.errors || [];
		loaded = true;
	});
</script>

<div class="flex w-full max-w-xs flex-col items-center gap-12">
	<div style="width: 56px; height: 71px;">
		<StaggeredLogo path="../../../" />
	</div>
	{#if loaded}
		<div
			class="mb-4 space-y-4 rounded bg-white px-8 pt-6 pb-8 shadow-md dark:bg-s-dark-2"
			in:scale
		>
			{#if status || errors.includes('already_verified')}
				<span>{ts.get.auth.verify_success}</span>
				<div class="mt-4 flex items-center justify-end">
					<Button
						title={ts.get.auth.sign_in}
						href={urls.login}
						align="center"
						class="w-full"
					/>
				</div>
			{:else if errors.length === 0}
				<span>{ts.get.auth.verify_general_error}</span>
			{:else if errors.includes('token_mismatch')}
				<span>{ts.get.auth.verify_token_mismatch}</span>
			{:else if errors.includes('token_expired')}
				<span>{ts.get.auth.verify_token_expired}</span>
			{/if}
		</div>
	{/if}
</div>
