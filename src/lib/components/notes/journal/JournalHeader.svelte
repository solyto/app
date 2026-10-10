<script lang="ts">
	import { getNotes } from '$lib/state/Notes.svelte';
	import { getTranslation } from '$lib/state/Translation.svelte';
	import { getLoadingIndicator } from '$lib/state/LoadingIndicator.svelte';
	import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
	import TextButton from '$lib/components/ui/buttons/TextButton.svelte';
	import { formatDateWithWeekday, isDateToday, isDateYesterday } from '$lib/helpers/DateHelper';

	const notes = getNotes();
	const ts = getTranslation();
	const loadingIndicator = getLoadingIndicator();
	const notifications = getUiNotifications();

	let { date } = $props<{ date: Date }>();

	let title = $derived(
		isDateToday(date)
			? ts.get.notes.today
			: isDateYesterday(date)
				? ts.get.notes.yesterday
				: formatDateWithWeekday(date)
	);

	async function save(): Promise<void> {
		loadingIndicator.start();
		const ok = await notes.saveContent();
		if (ok) notifications.success(ts.get.notes.save_success);
		else notifications.error(ts.get.notes.save_error);
		loadingIndicator.stop();
	}
</script>

<div class="flex flex-row items-start justify-between gap-4">
	<h2 class="text-3xl leading-tight font-bold">{title}</h2>
	<TextButton title={ts.get.layout.save} onclick={save} />
</div>
