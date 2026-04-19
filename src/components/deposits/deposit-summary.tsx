import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDollars } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import type { DepositWithDetails } from '@/lib/db/deposits';
import type { DepositItem } from '@/lib/db/deposit-items';

type Props = {
  deposit: DepositWithDetails;
  items: DepositItem[];
  imageUrls: Record<string, string>;
};

export function DepositSummary({ deposit, items, imageUrls }: Props) {
  const checks = items.filter((i) => i.item_type === 'check');
  const cashItems = items.filter((i) => i.item_type === 'cash' || i.item_type === 'coin');
  const specialItems = items.filter((i) => i.item_type === 'special');

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  for (const item of items) {
    const label = item.category_label ?? 'Uncategorized';
    categoryTotals[label] = (categoryTotals[label] ?? 0) + parseFloat(item.amount);
  }

  const counter1Name = deposit.counter_1
    ? (Array.isArray(deposit.counter_1) ? deposit.counter_1[0]?.full_name : deposit.counter_1.full_name)
    : 'Unknown';
  const counter2Name = deposit.counter_2
    ? (Array.isArray(deposit.counter_2) ? deposit.counter_2[0]?.full_name : deposit.counter_2.full_name)
    : null;

  return (
    <div className="space-y-6">
      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Deposit Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-lg">
            <span>Date</span>
            <span className="font-semibold">{formatDate(deposit.deposit_date)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Counter 1</span>
            <span className="font-semibold">{counter1Name}</span>
          </div>
          {counter2Name && (
            <div className="flex justify-between text-lg">
              <span>Counter 2 (Verifier)</span>
              <span className="font-semibold">{counter2Name}</span>
            </div>
          )}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-lg">
              <span>Total Checks ({checks.length})</span>
              <span className="font-semibold">{formatDollars(parseFloat(deposit.total_checks))}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Total Cash</span>
              <span className="font-semibold">{formatDollars(parseFloat(deposit.total_cash))}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold border-t pt-2">
              <span>Grand Total</span>
              <span>{formatDollars(parseFloat(deposit.total_amount))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">By Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([label, total]) => (
                <div key={label} className="flex justify-between text-lg">
                  <span>{label}</span>
                  <span className="font-semibold">{formatDollars(total)}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Check images */}
      {checks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Checks ({checks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checks.map((check) => (
                <div key={check.id} className="flex items-center gap-3 p-2 border rounded-lg">
                  {check.check_image_path && imageUrls[check.id] ? (
                    <a href={imageUrls[check.id]} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 w-20 h-12 rounded border overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrls[check.id]} alt="Check" className="w-full h-full object-cover" />
                    </a>
                  ) : (
                    <div className="shrink-0 w-20 h-12 rounded border bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                      No image
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold">{formatDollars(parseFloat(check.amount))}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {check.category_label}
                      {check.member_name && ` — ${check.member_name}`}
                      {check.giving_number && ` #${check.giving_number}`}
                      {check.check_number && ` (Check #${check.check_number})`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash detail */}
      {cashItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Cash Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {cashItems.map((item) => (
              <div key={item.id} className="mb-3">
                <p className="text-lg font-semibold">{formatDollars(parseFloat(item.amount))} — {item.category_label}</p>
                {item.denomination_counts && (
                  <div className="text-sm text-gray-500 mt-1">
                    {Object.entries(item.denomination_counts as Record<string, number>)
                      .filter(([, count]) => count > 0)
                      .map(([key, count]) => `${count} ${key}`)
                      .join(', ')}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
