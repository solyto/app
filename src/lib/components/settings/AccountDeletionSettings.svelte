<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { urls } from '$lib/config/urls';
	import { getAuth } from '$lib/state/Auth.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import { fade } from 'svelte/transition';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import PasswordInput from '$lib/components/forms/PasswordInput.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';

	const CONFIRMATION_WORD = 'DELETE';
	const LABEL = 'label-text mb-2 text-sm font-bold dark:text-white';

	const auth = getAuth();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let step = $state<'idle' | 'warning' | 'form' | 'sent'>('idle');
	let confirmation = $state<string>('');
	let password = $state<string>('');
	let confirmationError = $state<boolean>(false);
	let passwordError = $state<string | null>(null);
	let requestError = $state<boolean>(false);

	function validate(): boolean {
		confirmationError = confirmation !== CONFIRMATION_WORD;
		passwordError = password === '' ? ts.get.settings.current_password_required : null;
		requestError = false;

		return !confirmationError && passwordError === null;
	}

	async function submit(): Promise<void> {
		if (!validate()) return;

		loadingIndicator.start();
		try {
			const result = await auth.requestAccountDeletion(password, confirmation);
			if (result.data?.status === 'deleted') {
				notifications.success(ts.get.auth.confirm_deletion_success);
				await goto(resolve(urls.login));
			} else if (result.success) {
				step = 'sent';
			} else if (result.errors?.password) {
				passwordError = ts.get.settings.current_password_incorrect;
			} else {
				requestError = true;
			}
		} catch {
			requestError = true;
		} finally {
			loadingIndicator.stop();
		}
	}

	function submitLabel(): string {
		return auth.accountDeletionRequiresEmail ? ts.get.settings.delete_account_submit : ts.get.auth.confirm_deletion_submit;
	}

	function resend(): void {
		password = '';
		step = 'form';
	}

	function cancel(): void {
		step = 'idle';
		confirmation = '';
		password = '';
		confirmationError = false;
		passwordError = null;
		requestError = false;
	}
</script>

{#snippet error(message: string)}
	<p class="mt-2 pl-2 text-xs text-red-500" in:fade>{message}</p>
{/snippet}

<SettingsSection label={ts.get.settings.delete_account}>
	<div class="flex max-w-sm flex-col gap-4">
		<p class="text-sm text-c-neutral-5 dark:text-c-neutral-4">{ts.get.settings.delete_account_description}</p>

		{#if auth.user?.role === 'super_admin'}
			<p class="text-sm dark:text-white">{ts.get.settings.delete_account_super_admin}</p>
		{:else if step === 'idle' || step === 'warning'}
			<div>
				<TextButton title={ts.get.settings.delete_account_start} type="danger" onclick={() => (step = 'warning')} />
			</div>
		{:else if step === 'form'}
			<div class="flex flex-col gap-4">
				<label class="label">
					<div class={LABEL}>{ts.get.settings.delete_account_type_label}</div>
					<TextInput bind:value={confirmation} placeholder={CONFIRMATION_WORD} />
					{#if confirmationError}
						{@render error(ts.get.settings.delete_account_type_error)}
					{/if}
				</label>
				<label class="label">
					<div class={LABEL}>{ts.get.settings.current_password}</div>
					<PasswordInput bind:value={password} showToggle />
					{#if passwordError}
						{@render error(passwordError)}
					{/if}
				</label>
				{#if requestError}
					{@render error(ts.get.settings.delete_account_request_error)}
				{/if}
				<div class="mt-2 flex gap-4">
					<TextButton title={ts.get.layout.modal_cancel} type="plain" onclick={cancel} />
					<TextButton title={submitLabel()} type="danger" onclick={submit} />
				</div>
			</div>
		{:else}
			<p class="text-sm dark:text-white" in:fade>
				{ts.get.settings.delete_account_email_sent.replace('%s', auth.user?.email ?? '')}
			</p>
			<div>
				<TextButton title={ts.get.auth.forgot_password_resend} type="plain" onclick={resend} />
			</div>
		{/if}
	</div>
</SettingsSection>

{#if step === 'warning'}
	<ConfirmationModal
		type="confirm-delete"
		description={ts.get.settings.delete_account_warning}
		onConfirm={() => (step = 'form')}
		onCancel={() => (step = 'idle')}
	/>
{/if}
