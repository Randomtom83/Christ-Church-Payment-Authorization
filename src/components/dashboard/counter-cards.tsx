import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { formatDollars } from '@/lib/utils/currency';

type Props = {
  todaysDeposit: {
    id: string;
    total_amount: string;
    status: string;
  } | null;
};

export function CounterCards({ todaysDeposit }: Props) {
  if (!todaysDeposit) {
    return (
      <DashboardCard title="Sunday Deposit" icon="🏦" accent="blue">
        <div className="space-y-3">
          <p className="text-lg text-gray-600">No deposit started yet today.</p>
          <Link href="/deposits/new">
            <Button size="lg" className="w-full h-14 text-lg font-semibold">
              Start Counting
            </Button>
          </Link>
        </div>
      </DashboardCard>
    );
  }

  const status = todaysDeposit.status;
  const total = parseFloat(todaysDeposit.total_amount);

  if (status === 'in_progress') {
    return (
      <DashboardCard title="Deposit In Progress" icon="✏️" accent="blue">
        <div className="space-y-3">
          <p className="text-3xl font-bold text-gray-900">{formatDollars(total)}</p>
          <p className="text-base text-gray-600">entered so far</p>
          <Link href={`/deposits/${todaysDeposit.id}`}>
            <Button size="lg" className="w-full h-14 text-lg font-semibold">
              Continue Counting
            </Button>
          </Link>
        </div>
      </DashboardCard>
    );
  }

  if (status === 'pending_verification') {
    return (
      <DashboardCard title="Awaiting Verification" icon="⏳" accent="amber">
        <div className="space-y-3">
          <p className="text-3xl font-bold text-gray-900">{formatDollars(total)}</p>
          <p className="text-base text-amber-700">Waiting for a second counter to verify</p>
          <Link href={`/deposits/${todaysDeposit.id}`}>
            <Button variant="outline" size="lg" className="w-full h-12 text-base">
              View Summary
            </Button>
          </Link>
        </div>
      </DashboardCard>
    );
  }

  // verified or recorded
  return (
    <DashboardCard title="Deposit Complete" icon="✓" accent="green">
      <div className="flex items-center gap-3">
        <span className="text-3xl text-green-600">✓</span>
        <div>
          <p className="text-3xl font-bold text-gray-900">{formatDollars(total)}</p>
          <p className="text-base text-green-700">Verified and complete</p>
        </div>
      </div>
    </DashboardCard>
  );
}
