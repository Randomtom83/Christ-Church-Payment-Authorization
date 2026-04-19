/**
 * Fund categories for the counter module.
 * Each maps to a church income account code (seeded in migrations 003 + 009).
 * The counter UI shows these friendly labels; account_id lookup happens at save time.
 */

export const FUND_CATEGORIES = [
  { label: 'Pledge Payment', value: 'pledge', accountCode: '4010' },
  { label: 'Plate Offering', value: 'plate', accountCode: '4005' },
  { label: 'Altar Flowers', value: 'flowers', accountCode: '4040' },
  { label: 'Building Fund', value: 'building', accountCode: '4070' },
  { label: 'Outreach', value: 'outreach', accountCode: '4065' },
  { label: 'Support Our School', value: 'school', accountCode: '4075' },
  { label: 'Music Fund', value: 'music', accountCode: '4080' },
  { label: 'Animal Ministry', value: 'animal', accountCode: '4085' },
  { label: 'Food Ministry', value: 'food', accountCode: '4090-f' },
  { label: 'Easter Lilies', value: 'easter-lilies', accountCode: '4042' },
  { label: 'Memorial Offering', value: 'memorial', accountCode: '4055' },
  { label: 'Christmas', value: 'christmas', accountCode: '4025' },
  { label: 'Easter', value: 'easter', accountCode: '4030' },
  { label: 'Thanksgiving', value: 'thanksgiving', accountCode: '4035' },
  { label: 'Other Contributions', value: 'other', accountCode: '4050' },
] as const;

export type FundCategory = (typeof FUND_CATEGORIES)[number]['value'];

/** Cash denomination definitions. Values in cents. */
export const DENOMINATIONS = [
  { label: '$100 bills', key: 'hundreds', valueCents: 10000 },
  { label: '$50 bills', key: 'fifties', valueCents: 5000 },
  { label: '$20 bills', key: 'twenties', valueCents: 2000 },
  { label: '$10 bills', key: 'tens', valueCents: 1000 },
  { label: '$5 bills', key: 'fives', valueCents: 500 },
  { label: '$1 bills', key: 'ones', valueCents: 100 },
  { label: 'Quarters', key: 'quarters', valueCents: 25 },
  { label: 'Dimes', key: 'dimes', valueCents: 10 },
  { label: 'Nickels', key: 'nickels', valueCents: 5 },
  { label: 'Pennies', key: 'pennies', valueCents: 1 },
] as const;

export type DenominationKey = (typeof DENOMINATIONS)[number]['key'];
export type DenominationCounts = Record<DenominationKey, number>;

/** Calculate total cents from denomination counts. */
export function calculateCashTotalCents(counts: DenominationCounts): number {
  return DENOMINATIONS.reduce((total, d) => {
    return total + (counts[d.key] || 0) * d.valueCents;
  }, 0);
}
