# Backlog: budget items with a quarterly or yearly interval

created: 2026-11-17

## What

Let the user set an interval (`monthly`, `quarterly`, `yearly`) on budget
items (income and expense), and show the budget page in monthly amounts.
Depends on the API entry `budget-interval`, which adds the `interval` field.

- **Types:** `Budget`, `CreateBudgetRequest` and `UpdateBudgetRequest` in
  `src/lib/types/finance.ts` get `interval` (a `BudgetInterval` type).
  A budget without `interval` (older server) is treated as `monthly`.
- **Create:** an interval picker in `src/lib/components/finances/AddBudget.svelte`,
  default `monthly`.
- **Change on an existing item:** the history modal on
  `src/routes/finances/budget/+page.svelte` today only allows renaming
  (`onRename`); add a way to change the interval there, via
  `finances.updateBudget(budget, { interval })`.
- **Monthly amounts:** one helper that converts a budget to its monthly
  amount (`value / 3` for quarterly, `value / 12` for yearly). Use it in
  `getBudgetTotal()`, `getBudgetIncomeTotal()` and `getBudgetExpenseTotal()`
  (`src/lib/state/Finances.svelte.ts:62-75`), for the percentage bar in
  `src/lib/components/finances/BudgetField.svelte` (`:26-27`), and for the
  order of the items (largest monthly amount first).
- **Display:** an item with a non-monthly interval shows the monthly amount
  plus what was entered, e.g. "10,00 € / month · 120,00 € / year". Monthly
  items look as they do today.
- **i18n:** labels for the three intervals and the "per month / quarter /
  year" suffixes in all six locales (`src/lib/i18n/`), with the type in
  `src/lib/types/translation.ts`.
- **Tests:** unit tests for the conversion helper and the totals with mixed
  intervals, including a budget without `interval`.

The values in the history modal stay "amount per interval", as entered;
they are not converted. Changing the interval reinterprets the whole history
(decided: the interval is per budget item).

## Why

Users with quarterly or yearly costs or income currently have to divide by
3 or 12 by hand. Dev request, decided 2026-11-17: both income and expenses,
interval per budget item, the budget page stays a monthly view (no
monthly/yearly toggle).

## Notes

- Rounding: only round for display (`europeanFormat`); keep totals as
  unrounded sums so twelve yearly items don't drift.
- On an older server without the field, hide the interval picker rather than
  sending a field the server ignores; see `hide-features-on-older-servers`.
- Check: add a yearly expense of 120 € next to a monthly one of 10 €; the
  expense total is 20 €, the yearly item shows "10,00 € / month · 120,00 € /
  year", and switching it to monthly in the history modal changes the total
  to 130 €.
