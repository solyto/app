export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'RUB'] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = 'EUR';

export function isSupportedCurrency(value: string | null | undefined): value is Currency {
	return value != null && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}
