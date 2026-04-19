'use client';

import { formatDollars } from '@/lib/utils/currency';

type Props = {
  totalChecks: number;
  totalCash: number;
};

export function RunningTotals({ totalChecks, totalCash }: Props) {
  const grand = totalChecks + totalCash;

  return (
    <div className="sticky top-0 z-20 bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="flex justify-between items-center gap-4">
        <div className="text-center">
          <p className="text-sm font-medium text-blue-600">Checks</p>
          <p className="text-lg font-bold text-blue-900">{formatDollars(totalChecks)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-blue-600">Cash</p>
          <p className="text-lg font-bold text-blue-900">{formatDollars(totalCash)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600">Total</p>
          <p className="text-2xl font-bold text-blue-900">{formatDollars(grand)}</p>
        </div>
      </div>
    </div>
  );
}
