import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { formatDollars } from '@/lib/utils/currency';

type Props = {
  pendingCount: number;
  pendingTotal: number;
  todaysDeposit: {
    total_amount: string;
    status: string;
  } | null;
};

export function SignerCards({ pendingCount, pendingTotal, todaysDeposit }: Props) {
  return (
    <>
      <DashboardCard
        title="Pending Approvals"
        icon="✍️"
        accent={pendingCount > 0 ? 'blue' : 'green'}
      >
        {pendingCount > 0 ? (
          <div className="space-y-3">
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-gray-900">{pendingCount}</span>
              <span className="text-xl text-gray-600">{formatDollars(pendingTotal)}</span>
            </div>
            <p className="text-base text-gray-600">
              requisition{pendingCount !== 1 ? 's' : ''} awaiting your signature
            </p>
            <Link href="/requisitions">
              <Button size="lg" className="w-full h-14 text-lg font-semibold">
                Review & Approve
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-3xl">✓</span>
            <p className="text-xl text-green-800 font-medium">All caught up!</p>
          </div>
        )}
      </DashboardCard>

      {todaysDeposit && (
        <DashboardCard title="Today's Deposit" icon="🏦" accent="blue">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">
              {formatDollars(parseFloat(todaysDeposit.total_amount))}
            </p>
            <p className="text-base text-gray-600 capitalize">
              {todaysDeposit.status.replace('_', ' ')}
            </p>
          </div>
        </DashboardCard>
      )}
    </>
  );
}
