import type { CheckIn, CheckInType } from '$lib/types/check_in';
import { isDateLast7Days } from '$lib/helpers/DateHelper';

export default class CheckInStatisticsService {
	data: CheckIn[] = [];

	setData(data: CheckIn[]) {
		this.data = data;
	}

	getMeanValue(type: CheckInType): number {
		const values: number[] = [];

		for (const entry of this.data) {
			if (entry[type] !== null && entry[type] !== 0) {
				let value = entry[type];

				if (type === 'food_amount') {
					switch (entry[type]) {
						case 1:
							value = 1.25;
							break;
						case 2:
							value = 2.5;
							break;
						case 3:
							value = 3.75;
							break;
						case 4:
							value = 5;
							break;
						case 5:
							value = 3;
							break;
					}
				}

				values.push(value);
			}
		}

		return values.reduce((a, b) => a + b, 0) / values.length;
	}

	getTotalMeanValue(types: CheckInType[]): number {
		const values: number[] = [];

		for (const type of types) {
			values.push(this.getMeanValue(type));
		}

		const validValues = values.filter((v) => v != null && !isNaN(v));
		return validValues.length > 0
			? validValues.reduce((a, b) => a + b, 0) / validValues.length
			: 0;
	}

	getAmount(type: CheckInType): number {
		let value = 0;

		for (const entry of this.data) {
			if (isDateLast7Days(new Date(entry.date))) {
				if (entry[type] !== null && entry[type] !== 0) {
					value++;
				}
			}
		}

		return value;
	}
}
