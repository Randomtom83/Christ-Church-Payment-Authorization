'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DENOMINATIONS, calculateCashTotalCents, type DenominationCounts } from '@/lib/constants/fund-categories';
import { FUND_CATEGORIES } from '@/lib/constants/fund-categories';
import { centsToDollars, formatDollars } from '@/lib/utils/currency';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

type Props = {
  onSubmit: (totalCents: number, category: string, categoryLabel: string, counts: DenominationCounts) => Promise<void>;
};

const EMPTY_COUNTS: DenominationCounts = {
  hundreds: 0, fifties: 0, twenties: 0, tens: 0, fives: 0, ones: 0,
  quarters: 0, dimes: 0, nickels: 0, pennies: 0,
};

export function CashCalculator({ onSubmit }: Props) {
  const [counts, setCounts] = useState<DenominationCounts>({ ...EMPTY_COUNTS });
  const [category, setCategory] = useState('plate');
  const [isSaving, setIsSaving] = useState(false);

  const totalCents = calculateCashTotalCents(counts);

  const updateCount = (key: string, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key as keyof DenominationCounts] || 0) + delta),
    }));
  };

  const handleSubmit = async () => {
    if (totalCents <= 0) return;
    setIsSaving(true);
    const cat = FUND_CATEGORIES.find((c) => c.value === category);
    await onSubmit(totalCents, category, cat?.label ?? category, counts);
    setCounts({ ...EMPTY_COUNTS });
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Cash</h2>

      {/* Denomination rows */}
      <div className="space-y-2">
        {DENOMINATIONS.map((d) => {
          const count = counts[d.key as keyof DenominationCounts] || 0;
          const subtotalCents = count * d.valueCents;

          return (
            <div key={d.key} className="flex items-center justify-between gap-2 py-1">
              <span className="text-base font-medium text-gray-700 w-24 shrink-0">
                {d.label}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateCount(d.key, -1)}
                  className="h-11 w-11 rounded-lg bg-gray-200 text-xl font-bold text-gray-700 hover:bg-gray-300 flex items-center justify-center"
                  aria-label={`Decrease ${d.label}`}
                >
                  −
                </button>
                <span className="w-12 text-center text-lg font-semibold tabular-nums">
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => updateCount(d.key, 1)}
                  className="h-11 w-11 rounded-lg bg-blue-100 text-xl font-bold text-blue-700 hover:bg-blue-200 flex items-center justify-center"
                  aria-label={`Increase ${d.label}`}
                >
                  +
                </button>
              </div>

              <span className="w-24 text-right text-base tabular-nums text-gray-600">
                {formatDollars(centsToDollars(subtotalCents))}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
        <span className="text-lg font-semibold text-gray-900">Cash Total</span>
        <span className="text-2xl font-bold text-gray-900 tabular-nums">
          {formatDollars(centsToDollars(totalCents))}
        </span>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="cash-category" className="text-base font-medium">Category</Label>
        <select
          id="cash-category"
          className="w-full h-12 rounded-lg border border-gray-200 px-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {FUND_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Save button */}
      <Button
        type="button"
        size="lg"
        className="w-full h-14 text-lg font-semibold"
        onClick={handleSubmit}
        disabled={totalCents <= 0 || isSaving}
      >
        {isSaving ? <LoadingSpinner className="h-5 w-5" /> : 'Add Cash Entry'}
      </Button>
    </div>
  );
}
