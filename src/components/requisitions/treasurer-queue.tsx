'use client';

import { useState } from 'react';
import { RequisitionList } from '@/components/requisitions/requisition-list';

type TabConfig = {
  key: string;
  label: string;
  status: string | null; // null = "All"
};

const TABS: TabConfig[] = [
  { key: 'review', label: 'Needs Review', status: 'submitted' },
  { key: 'pending', label: 'Pending Signatures', status: 'pending_approval' },
  { key: 'ready', label: 'Ready to Send', status: 'approved' },
  { key: 'completed', label: 'Completed', status: 'paid' },
  { key: 'all', label: 'All', status: null },
];

type Props = {
  requisitions: Array<{
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
  counts: Record<string, number>;
};

export function TreasurerQueue({ requisitions, counts }: Props) {
  const [activeTab, setActiveTab] = useState('review');

  const currentTab = TABS.find((t) => t.key === activeTab)!;
  const filtered = currentTab.status
    ? requisitions.filter((r) => r.status === currentTab.status)
    : requisitions;

  // Sort: "Needs Review" = oldest first (FIFO), others = newest first
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.submitted_at).getTime();
    const dateB = new Date(b.submitted_at).getTime();
    return activeTab === 'review' ? dateA - dateB : dateB - dateA;
  });

  const emptyMessages: Record<string, string> = {
    review: 'No requisitions need review right now.',
    pending: 'No requisitions are waiting for signatures.',
    ready: 'No requisitions are ready to send.',
    completed: 'No completed requisitions yet.',
    all: 'No requisitions yet.',
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const count = tab.status ? (counts[tab.status] ?? 0) : undefined;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold whitespace-nowrap transition-colors min-h-[48px] ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {count !== undefined && count > 0 && (
                <span
                  className={`inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full text-sm font-bold ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : tab.key === 'review'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">{emptyMessages[activeTab]}</p>
        </div>
      ) : (
        <RequisitionList requisitions={sorted} />
      )}
    </div>
  );
}
