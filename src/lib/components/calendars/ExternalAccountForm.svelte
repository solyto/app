<script lang="ts">
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import PasswordInput from '$lib/components/forms/PasswordInput.svelte';
	import ModalFormRow from '$lib/components/ui/ModalFormRow.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import IconLoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { getExternalCalendars } from '$lib/state/ExternalCalendars.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import type {
		ExternalAccountError,
		ExternalAccountField,
		ExternalAccountResult,
		ExternalCalendarAccount
	} from '$lib/types/calendar';

	let { account = null, onSaved }: {
		account?: ExternalCalendarAccount | null;
		onSaved: (account: ExternalCalendarAccount) => void;
	} = $props();

	const externalCalendars = getExternalCalendars();
	const loadingIndicator = getLoadingIndicator();
	const ts = getTranslation();

	let serverUrl = $state<string>('');
	let username = $state<string>(account?.username ?? '');
	let password = $state<string>('');
	let submitting = $state<boolean>(false);
	let error = $state<ExternalAccountError | null>(null);

	const shownFields: ExternalAccountField[] = account ? ['username', 'password'] : ['server_url', 'username', 'password'];

	function canSubmit(): boolean {
		return !submitting && username.trim() !== '' && password !== '' && (account !== null || serverUrl.trim() !== '');
	}

	function fieldError(field: ExternalAccountField): string | null {
		if (error === null || error.field !== field) return null;
		return externalCalendars.service.message(error, ts.get.calendar, ts.get.layout);
	}

	function generalError(): string | null {
		if (error === null || (error.field !== null && shownFields.includes(error.field))) return null;
		return externalCalendars.service.message(error, ts.get.calendar, ts.get.layout);
	}

	function save(): Promise<ExternalAccountResult<ExternalCalendarAccount>> {
		if (account) {
			return externalCalendars.updateAccount(account, { username: username.trim(), password });
		}
		return externalCalendars.addAccount({ server_url: serverUrl.trim(), username: username.trim(), password });
	}

	async function submit(): Promise<void> {
		if (!canSubmit()) return;

		submitting = true;
		error = null;
		loadingIndicator.start();

		try {
			const result = await save();
			if (result.ok) {
				onSaved(result.data);
			} else {
				error = result.error;
			}
		} finally {
			submitting = false;
			loadingIndicator.stop();
		}
	}
</script>

{#snippet fieldMessage(field: ExternalAccountField)}
	{#if fieldError(field)}
		<p class="mt-1 text-xs text-c-danger">{fieldError(field)}</p>
	{/if}
{/snippet}

<div class="flex flex-col gap-3">
	{#if account}
		<p class="text-sm text-c-neutral-5">
			{ts.get.calendar.account_change_password_hint.replace('%s', externalCalendars.service.host(account.server_url))}
		</p>
	{:else}
		<ModalFormRow label={ts.get.calendar.connect_server_url}>
			<TextInput bind:value={serverUrl} />
			{@render fieldMessage('server_url')}
		</ModalFormRow>
	{/if}
	<ModalFormRow label={ts.get.calendar.connect_username}>
		<TextInput bind:value={username} />
		{@render fieldMessage('username')}
	</ModalFormRow>
	<ModalFormRow label={ts.get.calendar.connect_password}>
		<PasswordInput bind:value={password} showToggle />
		{@render fieldMessage('password')}
	</ModalFormRow>
	<p class="text-xs text-c-neutral-4">{ts.get.calendar.connect_password_hint}</p>
	{#if generalError()}
		<p class="text-sm text-c-danger">{generalError()}</p>
	{/if}
	<div class="mt-2 flex items-center justify-end gap-2">
		{#if submitting}
			<IconLoaderCircle class="size-5 animate-spin text-c-neutral-5" />
		{/if}
		<TextButton
			title={account ? ts.get.layout.save : ts.get.calendar.connect_submit}
			onclick={submit}
			disabled={!canSubmit()}
		/>
	</div>
</div>
