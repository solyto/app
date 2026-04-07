import type { WealthField } from '$lib/types/finance';
import { SvelteDate } from 'svelte/reactivity';
import { getDateMinusDays, getUrlFormat, isDateAfter } from '$lib/helpers/DateHelper';
import { number } from 'echarts';

export default class WealthStatisticsService {
	data: WealthField[] = [];

	setData(data: WealthField[]) {
		this.data = data;
	}

	getGraphValues(): { date: string; values: { field: string; value: number }[] }[] {
		const allDates: string[] = [];
		const currentDate = new SvelteDate();
		const values: { date: string; values: { field: string; value: number }[] } = [];
		const lastValues: Record<number, number> = {};

		// Initialize lastValues with current values if available, or 0
		for (const field of this.data) {
			if (field.currentValue) {
				lastValues[field.id] = field.currentValue.value;
			} else {
				lastValues[field.id] = 0;
			}
		}

		// We iterate backwards from now, but we want to build the array chronologically
		// So we will collect them and then reverse or just iterate 11 down to 0
		const result: { date: string; values: { field: string; value: number }[] }[] = [];

		// We want to start from the oldest month (11 months ago) to now
		for (let i = 11; i >= 0; i--) {
			const date = new SvelteDate(currentDate);
			date.setMonth(date.getMonth() - i);

			const urlFormat = getUrlFormat(date);
			const entry = { date: urlFormat, values: [] as { field: string; value: number }[] };

			// For this specific month, we need to determine the value for each field
			for (const field of this.data) {
				// Find the most recent value on or before this month
				// Since values are historical, we need to find the one that applies to this date
				// We look for a value with a date <= current iteration date

				// Filter values that are on or before the target date
				const relevantValues = field.values.filter((v) => {
					// Assuming v.date is a string like "YYYY-MM-DD"
					const valueDate = new SvelteDate(v.date);
					// We compare roughly by checking if it's before or same as the target month's end?
					// Actually simple string comparison works if format is YYYY-MM-DD
					// but let's use date objects to be safe or just rely on the "closest previous" logic
					return (
						valueDate <= date ||
						getUrlFormat(valueDate).substring(0, 7) === urlFormat.substring(0, 7)
					);
				});

				// Sort by date descending to get the latest one
				relevantValues.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
				);

				let valueToUse = 0;

				if (relevantValues.length > 0) {
					valueToUse = relevantValues[0].value;
				} else {
					// If no value found before this date, we might have 0 or should we look ahead?
					// The requirement says "take the value of the month before that".
					// If there is ABSOLUTELY no value before this date, it's 0.
					valueToUse = 0;

					// However, iterating chronologically (oldest to newest) is easier for "carry forward".
					// But the loop is currently i=11 (oldest) to i=0 (now).
				}

				entry.values.push({ field: field.title, value: valueToUse });
			}
			result.push(entry);
		}

		// Refined Logic:
		// The previous logic inside the loop is a bit heavy (filtering every time).
		// A better approach for "carry forward" is to calculate the state at the start (12 months ago)
		// and then update it step by step.

		const refinedResult: { date: string; values: { field: string; value: number }[] }[] = [];

		// 1. Determine the start date (11 months ago)
		const startDate = new SvelteDate(currentDate);
		startDate.setMonth(startDate.getMonth() - 11);

		// 2. Initialize 'current' values for all fields based on what was the value BEFORE the start date
		const currentFieldValues: Record<number, number> = {};

		for (const field of this.data) {
			// Get values strictly before the start of our graph window
			const pastValues = field.values.filter((v) => new SvelteDate(v.date) < startDate);
			pastValues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

			if (pastValues.length > 0) {
				currentFieldValues[field.id] = pastValues[0].value;
			} else {
				currentFieldValues[field.id] = 0;
			}
		}

		// 3. Loop 11 down to 0 (Chronological: Oldest -> Newest)
		for (let i = 11; i >= 0; i--) {
			const date = new SvelteDate(currentDate);
			date.setMonth(date.getMonth() - i);
			// Set to end of month to ensure we catch values happened during that month?
			// Or just use the month identifier. Let's stick to identifying by Month.
			const monthStr = getUrlFormat(date).substring(0, 7); // YYYY-MM

			const entry = {
				date: getUrlFormat(date),
				values: [] as { field: string; value: number }[]
			};

			for (const field of this.data) {
				// Check if there is a specific value set for THIS month
				// We look for the LATEST value recorded in this specific month
				const valuesInThisMonth = field.values.filter((v) =>
					getUrlFormat(new SvelteDate(v.date)).startsWith(monthStr)
				);

				if (valuesInThisMonth.length > 0) {
					// Determine the latest value in this month
					valuesInThisMonth.sort(
						(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
					);
					currentFieldValues[field.id] = valuesInThisMonth[0].value;
				}
				// If no value in this month, we keep currentFieldValues[field.id] (carry forward)

				entry.values.push({ field: field.title, value: currentFieldValues[field.id] });
			}
			refinedResult.push(entry);
		}

		return refinedResult;
	}

	getUniqueDates(): string[] {
		const dates: string[] = [];
		const lastAcceptablePoint = getDateMinusDays(new SvelteDate(), 365);

		for (const entry of this.data) {
			if (entry.values.length > 0) {
				for (const value of entry.values) {
					const urlFormat = getUrlFormat(new SvelteDate(value.date));

					if (
						!dates.includes(urlFormat) &&
						isDateAfter(new SvelteDate(value.date), lastAcceptablePoint)
					) {
						dates.push(urlFormat);
					}
				}
			}
		}

		dates.sort((a, b) => a.localeCompare(b));

		return dates;
	}
}
