'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/requisitions/status-badge';
import { formatDollars } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';

type DepositItem = {
  id: string;
  deposit_date: string;
  total_amount: string;
  status: string;
  counter_1: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  counter_2: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
};

type Props = {
  deposits: DepositItem[];
};

export function DepositList({ deposits }: Props) {
  if (deposits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-500">No deposits yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deposits.map((d) => {
        const c1 = d.counter_1 ? (Array.isArray(d.counter_1) ? d.counter_1[0]?.full_name : d.counter_1.full_name) : null;
        const c2 = d.counter_2 ? (Array.isArray(d.counter_2) ? d.counter_2[0]?.full_name : d.counter_2.full_name) : null;

        return (
          <Link key={d.id} href={`/deposits/${d.id}`}>
            <Card className="hover:border-blue-300 transition-colors cursor-pointer">
              <CardContent className="py-4 px-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(d.deposit_date)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {c1}{c2 ? ` & ${c2}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <p className="text-lg font-bold text-gray-900">
                      {formatDollars(parseFloat(d.total_amount))}
                    </p>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
