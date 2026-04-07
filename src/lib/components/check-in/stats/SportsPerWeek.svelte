<script lang="ts">
	import type { CheckIn } from '$lib/types/check_in';
	import CheckInStatisticsService from '$lib/services/CheckInStatisticsService';
	import { getTranslation } from '$lib/state/Translation.svelte.js';
	import Card from '$lib/components/ui/Card.svelte';
	import IconDumbbell from '@lucide/svelte/icons/dumbbell';

	const service = new CheckInStatisticsService();
	const ts = getTranslation();

	let { data } = $props<{ data: CheckIn[] }>();

	service.setData(data);

	const sportsCount = service.getAmount('sports');
	const maxCount = 7;
</script>

<Card fixedWidth={true} fullWidth={true} hover={false}>
	<div class="flex flex-col gap-3">
		<div class="flex items-center gap-3">
			<div
				class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-c-neutral dark:bg-s-dark-3"
			>
				<IconDumbbell class="h-4 w-4 text-c-heading dark:text-c-primary" />
			</div>
			<div class="min-w-0 flex-1">
				<div class="mb-1 flex items-center justify-between">
					<p class="text-base font-medium text-c-neutral-7 dark:text-c-neutral-3">
						{ts.get.checkIn.sports}
					</p>
					<p class="text-base font-semibold text-c-neutral-9 dark:text-white">
						{sportsCount} / {ts.get.checkIn.week}
					</p>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-c-neutral-1 dark:bg-s-dark-3">
					<div
						class="h-full rounded-full bg-c-primary transition-all duration-300"
						style="width: {(sportsCount / maxCount) * 100}%"
					></div>
				</div>
			</div>
		</div>
	</div>
</Card>
