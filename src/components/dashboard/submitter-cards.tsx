import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { StatusBadge } from '@/components/requisitions/status-badge';
import { formatDollars } from '@/lib/utils/currency';

type ActiveReq = {
  id: string;
  req_number: number;
  payee_name: string;
  amount: string;
  status: string;
};

type Props = {
  activeCount: number;
  recentItems: ActiveReq[];
};

export function SubmitterCards({ activeCount, recentItems }: Props) {
  return (
    <DashboardCard
      title="My Requisitions"
      icon="📋"
      accent={activeCount > 0 ? 'blue' : 'gray'}
    >
      <div className="space-y-4">
        {activeCount > 0 ? (
          <>
            <p className="text-base text-gray-600">
              {activeCount} active requisition{activeCount !== 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {recentItems.map((r) => (
                <Link key={r.id} href={`/requisitions/${r.id}`} className="block">
                  <div className="flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 -mx-2">
                    <div className="min-w-0">
                      <p className="text-base font-medium text-gray-900 truncate">{r.payee_name}</p>
                      <p className="text-sm text-gray-500">#{r.req_number} &middot; {formatDollars(parseFloat(r.amount))}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/requisitions">
              <Button variant="outline" size="lg" className="w-full h-12 text-base">
                View All
              </Button>
            </Link>
          </>
        ) : (
          <p className="text-base text-gray-500">No active requisitions.</p>
        )}

        <Link href="/requisitions/new">
          <Button size="lg" className="w-full h-14 text-lg font-semibold">
            + New Requisition
          </Button>
        </Link>
      </div>
    </DashboardCard>
  );
}
