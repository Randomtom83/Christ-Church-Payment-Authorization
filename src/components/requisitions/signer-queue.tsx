'use client';

import { useState } from 'react';
import { RequisitionList } from '@/components/requisitions/requisition-list';
import { formatDollars } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/requisitions/status-badge';

type SignerQueueProps = {
  pending: Array<{
    id: string;
    req_number: number;
    payee_name: string;
    amount: string;
    entity: string;
    status: string;
    submitted_at: string;
    account: { id: string; name: string; category: string } | { id: string; name: string; category: string }[] | null;
    submitter: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  }>;
  recentApprovals: Array<{
    id: string;
    action: string;
    signed_at: string;
    requisition: { id: string; req_number: number; payee_name: string; amount: string; entity: string; status: string } | null;
  }>;
};

export function SignerQueue({ pending, recentApprovals }: SignerQueueProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'recent'>('pending');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold whitespace-nowrap transition-colors min-h-[48px] ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Needs My Signature
          {pending.length > 0 && (
            <span
              className={`inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full text-sm font-bold ${
                activeTab === 'pending'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold whitespace-nowrap transition-colors min-h-[48px] ${
            activeTab === 'recent'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Recently Signed
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        pending.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">No requisitions need your signature right now.</p>
          </div>
        ) : (
          <RequisitionList requisitions={pending} />
        )
      )}

      {activeTab === 'recent' && (
        recentApprovals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">No recent approvals.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentApprovals.map((approval) => {
              const req = Array.isArray(approval.requisition)
                ? approval.requisition[0]
                : approval.requisition;
              if (!req) return null;

              return (
                <Link key={approval.id} href={`/requisitions/${req.id}`}>
                  <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                    <CardContent className="py-4 px-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-semibold text-gray-900 truncate">
                            {req.payee_name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            #{req.req_number} &middot; You {approval.action} &middot; {formatDate(approval.signed_at)}
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
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
