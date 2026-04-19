import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { formatDollars } from '@/lib/utils/currency';

type Props = {
  counts: Record<string, number>;
  weeklySummary: { requisitionsProcessed: number; totalPaid: number; totalDeposits: number };
};

export function TreasurerCards({ counts, weeklySummary }: Props) {
  const needsReview = counts.submitted ?? 0;
  const pendingSigs = counts.pending_approval ?? 0;
  const readyToSend = counts.approved ?? 0;

  return (
    <>
      <DashboardCard
        title="Needs Review"
        icon="📋"
        accent={needsReview > 0 ? 'amber' : 'green'}
      >
        <div className="space-y-3">
          <span className="text-4xl font-bold text-gray-900">{needsReview}</span>
          {needsReview > 0 ? (
            <Link href="/requisitions">
              <Button size="lg" className="w-full h-14 text-lg font-semibold">
                Review Queue
              </Button>
            </Link>
          ) : (
            <p className="text-base text-green-700">No new requisitions to review</p>
          )}
        </div>
      </DashboardCard>

      <DashboardCard
        title="Ready to Send"
        icon="💵"
        accent={readyToSend > 0 ? 'blue' : 'gray'}
      >
        <div className="space-y-3">
          <span className="text-4xl font-bold text-gray-900">{readyToSend}</span>
          {readyToSend > 0 ? (
            <Link href="/requisitions">
              <Button size="lg" className="w-full h-14 text-lg font-semibold bg-green-700 hover:bg-green-800">
                Process Payments
              </Button>
            </Link>
          ) : (
            <p className="text-base text-gray-500">No payments ready</p>
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="Pending Signatures" icon="⏳" accent="gray">
        <span className="text-4xl font-bold text-gray-900">{pendingSigs}</span>
        <p className="text-base text-gray-500 mt-1">waiting on signers</p>
      </DashboardCard>

      <DashboardCard title="This Week" icon="📊" accent="gray" className="md:col-span-2">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">{weeklySummary.requisitionsProcessed}</p>
            <p className="text-sm text-gray-500">Paid</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{formatDollars(weeklySummary.totalPaid)}</p>
            <p className="text-sm text-gray-500">Amount</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{formatDollars(weeklySummary.totalDeposits)}</p>
            <p className="text-sm text-gray-500">Deposited</p>
          </div>
        </div>
      </DashboardCard>
    </>
  );
}
