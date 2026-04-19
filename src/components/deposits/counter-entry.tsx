'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { RunningTotals } from '@/components/deposits/running-totals';
import { CheckEntry } from '@/components/deposits/check-entry';
import { CheckList } from '@/components/deposits/check-list';
import { CashCalculator } from '@/components/deposits/cash-calculator';
import { SpecialEntry } from '@/components/deposits/special-entry';
import { addCheckItem, addCashItem, addSpecialItem, deleteItem } from '@/lib/actions/deposit-items';
import { submitForVerification } from '@/lib/actions/deposits';
import type { DepositItem } from '@/lib/db/deposit-items';
import type { DenominationCounts } from '@/lib/constants/fund-categories';

type MemberOption = { id: string; full_name: string; giving_number: string | null };

type Props = {
  depositId: string;
  initialItems: DepositItem[];
  members: MemberOption[];
  imageUrls: Record<string, string>;
};

export function CounterEntry({ depositId, initialItems, members, imageUrls }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<DepositItem[]>(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = items.filter((i) => i.item_type === 'check');
  const cashItems = items.filter((i) => i.item_type === 'cash' || i.item_type === 'coin');
  const specialItems = items.filter((i) => i.item_type === 'special');

  const totalChecks = checks.reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const totalCash = cashItems.reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const totalSpecial = specialItems.reduce((sum, i) => sum + parseFloat(i.amount), 0);

  const handleAddCheck = useCallback(async (formData: FormData) => {
    const result = await addCheckItem(depositId, formData);
    if (result.success) {
      router.refresh();
      // Optimistic: just refresh the page to get updated items
    } else {
      setError(result.error ?? 'Failed to add check');
    }
  }, [depositId, router]);

  const handleAddCash = useCallback(async (totalCents: number, category: string, categoryLabel: string, counts: DenominationCounts) => {
    const formData = new FormData();
    formData.set('total_cents', String(totalCents));
    formData.set('category', category);
    formData.set('category_label', categoryLabel);
    formData.set('denomination_counts', JSON.stringify(counts));

    const result = await addCashItem(depositId, formData);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Failed to add cash');
    }
  }, [depositId, router]);

  const handleAddSpecial = useCallback(async (formData: FormData) => {
    const result = await addSpecialItem(depositId, formData);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Failed to add special item');
    }
  }, [depositId, router]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    const result = await deleteItem(depositId, itemId);
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  }, [depositId]);

  const handleSubmitForVerification = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await submitForVerification(depositId);
    if (result.success) {
      router.push(`/deposits/${depositId}?submitted=true`);
    } else {
      setError(result.error ?? 'Failed to submit');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Sticky running totals */}
      <RunningTotals totalChecks={totalChecks} totalCash={totalCash + totalSpecial} />

      <div className="px-4 py-6 space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
            <p className="text-base text-red-800">{error}</p>
          </div>
        )}

        {/* Section A: Checks */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Checks</h2>
          <div className="space-y-4">
            <CheckEntry members={members} onSubmit={handleAddCheck} />
            <CheckList
              checks={checks}
              imageUrls={imageUrls}
              onDelete={handleDeleteItem}
            />
          </div>
        </section>

        {/* Section B: Cash */}
        <section>
          <CashCalculator onSubmit={handleAddCash} />
          {/* Show existing cash entries */}
          {cashItems.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-base font-medium text-gray-600">
                {cashItems.length} cash entr{cashItems.length !== 1 ? 'ies' : 'y'}
              </p>
              {cashItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div>
                    <p className="text-lg font-semibold">${parseFloat(item.amount).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{item.category_label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-10 w-10 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section C: Special */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Special / Designated</h2>
          <SpecialEntry onSubmit={handleAddSpecial} />
          {specialItems.length > 0 && (
            <div className="mt-4 space-y-2">
              {specialItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div>
                    <p className="text-lg font-semibold">${parseFloat(item.amount).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{item.notes} — {item.category_label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-10 w-10 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit for verification */}
        <section className="border-t border-gray-200 pt-6">
          <Button
            type="button"
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-green-700 hover:bg-green-800"
            onClick={handleSubmitForVerification}
            disabled={isSubmitting || (totalChecks + totalCash + totalSpecial) <= 0}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="mr-2 h-5 w-5" />
                Submitting...
              </>
            ) : (
              '✓ Review & Submit for Verification'
            )}
          </Button>
        </section>
      </div>
    </div>
  );
}
