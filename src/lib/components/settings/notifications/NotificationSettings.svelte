<script lang="ts">
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import Card from '$lib/components/ui/Card.svelte';
	import ManagePushNotifications from '$lib/components/settings/notifications/ManagePushNotifications.svelte';
	import ManageNotificationTypes from '$lib/components/settings/notifications/ManageNotificationTypes.svelte';
	import TelegramBotConnection from '$lib/components/settings/TelegramBotConnection.svelte';

	const ts = getTranslation();
</script>

<div class="flex flex-col gap-6">
	<div class="flex gap-6 max-lg:flex-col md:p-4">
		<Card label={ts.get.settings.telegram_bot} hover={false}>
			<TelegramBotConnection />
		</Card>
		<Card label={ts.get.settings.push_notifications} hover={false}>
			<ManagePushNotifications />
		</Card>
	</div>

	<div class="md:p-4">
		<Card label={ts.get.settings.notifications} hover={false} fullWidth={true}>
			<p class="mb-4 text-sm text-c-neutral-6 dark:text-c-neutral-4">
				Choose which notifications you want to receive and through which channels.
			</p>
			<ManageNotificationTypes />
		</Card>
	</div>
</div>
