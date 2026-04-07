<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { urls } from '$lib/config/urls';
	import { resolve } from '$app/paths';
	import { getAuth } from '$lib/state/Auth.svelte.js';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte.js';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte.js';

	import { fade } from 'svelte/transition';
	import AuthNavbar from '$lib/components/auth/AuthNavbar.svelte';
	import Button from '$lib/components/ui/buttons/Button.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import PasswordInput from '$lib/components/forms/PasswordInput.svelte';
	import StaggeredLogo from '$lib/components/ui/StaggeredLogo.svelte';

	const auth = getAuth();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let email = $state<string>('');
	let emailError = $state<boolean>(false);
	let password = $state<string>('');
	let passwordError = $state<boolean>(false);
	let error = $state<boolean>(false);

	onMount(() => {
		if (auth.loggedIn) goto(resolve(urls.home));
	});

	async function onsubmit(e: SubmitEvent): Promise<void> {
		e.preventDefault();

		if (!validateInput()) return;

		loadingIndicator.start();
		let success = await auth.login({ email, password });
		loadingIndicator.stop();

		if (success) {
			ts.loadLanguage();
			notifications.success(ts.get.auth.login_success);
			await goto(resolve(urls.home));
		} else {
			notifications.error(ts.get.auth.login_error);
			error = true;
		}
	}

	function validateInput(): boolean {
		emailError = false;
		passwordError = false;
		emailError = email === '';
		passwordError = password === '';
		error = passwordError || emailError;

		return !(emailError || passwordError);
	}
</script>

<!--<AuthNavbar />-->
<div class="flex w-full max-w-xs flex-col items-center gap-12" class:animate-shake={error}>
	<div style="width: 56px; height: 71px;">
		<StaggeredLogo path="../" />
	</div>
	<form
		class="mb-4 flex flex-col space-y-4 rounded-lg border-2 border-white/5 bg-white px-8 pt-6 pb-8 shadow-sm md:min-w-80 dark:bg-s-dark-2"
		{onsubmit}
	>
		<label class="label">
			<div class="label-text mb-2 text-sm font-bold dark:text-white">{ts.get.auth.email}</div>
			<TextInput bind:value={email} />
			{#if emailError}
				<p class="mt-2 pl-2 text-xs text-red-500" in:fade>{ts.get.auth.email_error}</p>
			{/if}
		</label>
		<label class="label">
			<div class="label-text mb-2 text-sm font-bold dark:text-white">
				{ts.get.auth.password}
			</div>
			<PasswordInput bind:value={password} showToggle />
			{#if passwordError}
				<p class="mt-2 pl-2 text-xs text-red-500" in:fade>{ts.get.auth.password_error}</p>
			{/if}
		</label>
		<div class="mt-4 flex items-center justify-end">
			<Button title={ts.get.auth.sign_in} class="w-full" />
		</div>
	</form>
</div>
