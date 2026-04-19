'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/requisitions/status-badge';
import { formatDollars } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';

type RequisitionItem = {
  id: string;
  req_number: number;
  payee_name: string;
  amount: string;
  entity: string;
  status: string;
  submitted_at: string;
  // Supabase joins may return object or array depending on relation type
  account: { id: string; name: string; category: string } | { id: string; name: string; category: string }[] | null;
  submitter: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
};

type Props = {
  requisitions: RequisitionItem[];
};

export function RequisitionList({ requisitions }: Props) {
  if (requisitions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-500 mb-2">No requisitions yet</p>
        <p className="text-lg text-gray-400">
          Tap the button above to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requisitions.map((req) => (
        <Link key={req.id} href={`/requisitions/${req.id}`}>
          <Card className="hover:border-blue-300 transition-colors cursor-pointer">
            <CardContent className="py-4 px-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {req.payee_name}
                  </p>
                  <p className="text-base text-gray-600">
                    {req.account
                      ? (Array.isArray(req.account) ? req.account[0]?.name : req.account.name) ?? 'No account'
                      : 'No account'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    #{req.req_number} &middot; {formatDate(req.submitted_at)}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-2">
                  <p className="text-lg font-bold text-gray-900">
                    {formatDollars(req.amount)}
                  </p>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
