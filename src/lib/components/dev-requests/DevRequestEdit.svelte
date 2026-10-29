<script lang="ts">
	import { onMount } from 'svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import type {
		DevRequestPriority,
		DevRequestType,
		DevRequestForm
	} from '$lib/types/dev_request';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import { getDevRequests } from '$lib/state/DevRequests.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import ContentModal from '$lib/components/ui/ContentModal.svelte';
	import FileUpload from '$lib/components/forms/FileUpload.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import { getAuth } from '$lib/state/Auth.svelte';

	const ts = getTranslation();
	const devRequests = getDevRequests();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();
	const auth = getAuth();

	let { onClose }: {
		onClose: () => void;
	} = $props();

	const emptyForm: DevRequestForm = {
		title: '',
		description: '',
		type: 'bug',
		priority: '1',
		screenshot: '',
		screenshot_name: '',
		url: ''
	};
	let form = $state<DevRequestForm>(emptyForm);

	const typeOptions: { value: string; label: string }[] = [
		{ value: 'bug', label: 'Bug' },
		{ value: 'feature', label: 'Feature' }
	];

	const priorityOptions: { value: string; label: string }[] = [
		{ value: '1', label: ts.get.dev.requests.priority_1 },
		{ value: '2', label: ts.get.dev.requests.priority_2 },
		{ value: '3', label: ts.get.dev.requests.priority_3 },
		{ value: '4', label: ts.get.dev.requests.priority_4 },
		{ value: '5', label: ts.get.dev.requests.priority_5 }
	];

	onMount(async () => {
		loadingIndicator.start();
		await devRequests.load();
		loadingIndicator.stop();
	});

	async function onSave() {
		loadingIndicator.start();

		if (form.title === '' || form.description === '') {
			loadingIndicator.stop();
			notifications.error(ts.get.dev.requests.validation_error);
			return;
		}

		const res = await devRequests.create({
			title: form.title,
			description: form.description,
			screenshot: form.screenshot != '' ? form.screenshot : null,
			screenshot_name: form.screenshot_name != '' ? form.screenshot_name : null,
			priority: parseInt(form.priority) as DevRequestPriority,
			url: form.url,
			type: form.type as DevRequestType,
			created_by_user_id: auth.user?.id ?? null
		});
		form = { ...emptyForm };
		if (res) await devRequests.load();
		loadingIndicator.stop();
		onClose();
	}
</script>

<ContentModal title={ts.get.dev.requests.new} rounded="2xl" p="8" {onClose}>
	<div class="flex flex-col gap-3">
		<TextInput placeholder={ts.get.dev.requests.title} bind:value={form.title} />
		<TextInput
			placeholder={ts.get.dev.requests.description}
			bind:value={form.description}
			multiLine={true}
			height={150}
		/>
		<Select bind:value={form.type} options={typeOptions} />
		<Select bind:value={form.priority} options={priorityOptions} />
		<FileUpload
			label={ts.get.dev.requests.screenshot}
			bind:value={form.screenshot}
			bind:filename={form.screenshot_name}
		/>
		<TextInput placeholder="URL" bind:value={form.url} />
		<div class="mt-4 flex w-full justify-end">
			<TextButton title={ts.get.layout.save} type="btn" onclick={onSave} />
		</div>
	</div>
</ContentModal>
