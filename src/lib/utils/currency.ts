/**
 * Money formatting utilities.
 * Per CLAUDE.md: never use JavaScript floating point for money.
 * Database stores DECIMAL(10,2). JS uses integer cents for calculations.
 */

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** Format integer cents as "$1,234.56" */
export function formatCurrency(cents: number): string {
  return formatter.format(cents / 100);
}

/** Format a dollar amount (from DB DECIMAL) as "$1,234.56" */
export function formatDollars(dollars: number | string): string {
  const num = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  return formatter.format(num);
}

/** Convert a dollar string (e.g. "350.00") to integer cents. */
export function dollarsToCents(dollars: string | number): number {
  const str = typeof dollars === 'number' ? dollars.toFixed(2) : dollars;
  // Use string math to avoid float issues: split on decimal, combine
  const [whole, frac = '0'] = str.split('.');
  const wholeNum = parseInt(whole, 10) || 0;
  const fracNum = parseInt(frac.padEnd(2, '0').slice(0, 2), 10);
  return wholeNum * 100 + (wholeNum < 0 ? -fracNum : fracNum);
}

/** Convert integer cents to dollar number (for display only, not calculations). */
export function centsToDollars(cents: number): number {
  return cents / 100;
}
