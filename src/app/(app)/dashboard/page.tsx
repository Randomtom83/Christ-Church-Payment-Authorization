import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  getPendingForSignerCount,
  getTreasurerCounts,
  getTodaysDeposit,
  getRecentActivity,
  getWeeklySummary,
  getUserActiveRequisitions,
  getSystemHealth,
} from '@/lib/db/dashboard';
import { Greeting } from '@/components/dashboard/greeting';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { SignerCards } from '@/components/dashboard/signer-cards';
import { TreasurerCards } from '@/components/dashboard/treasurer-cards';
import { CounterCards } from '@/components/dashboard/counter-cards';
import { SubmitterCards } from '@/components/dashboard/submitter-cards';
import { AdminCards } from '@/components/dashboard/admin-cards';
import { ActivityFeed } from '@/components/dashboard/activity-feed';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const roles = auth.profile.role as string[];
  const isSigner = roles.includes('signer');
  const isTreasurer = roles.includes('treasurer');
  const isCounter = roles.includes('counter');
  const isAdmin = roles.includes('admin');
  const isSubmitter = roles.includes('submitter');

  // Fetch data in parallel based on roles
  const [
    signerData,
    treasurerData,
    todaysDeposit,
    activity,
    submitterData,
    adminData,
  ] = await Promise.all([
    isSigner ? getPendingForSignerCount(auth.profile.id) : null,
    isTreasurer ? Promise.all([getTreasurerCounts(), getWeeklySummary()]) : null,
    (isSigner || isCounter || isTreasurer) ? getTodaysDeposit() : null,
    getRecentActivity(10),
    isSubmitter ? getUserActiveRequisitions(auth.profile.id) : null,
    isAdmin ? getSystemHealth() : null,
  ]);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Greeting name={auth.profile.full_name} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Admin cards */}
          {isAdmin && adminData && (
            <AdminCards health={adminData} />
          )}

          {/* Signer cards */}
          {isSigner && signerData && (
            <SignerCards
              pendingCount={signerData.count}
              pendingTotal={signerData.totalDollars}
              todaysDeposit={todaysDeposit}
            />
          )}

          {/* Treasurer cards */}
          {isTreasurer && treasurerData && (
            <TreasurerCards
              counts={treasurerData[0]}
              weeklySummary={treasurerData[1]}
            />
          )}

          {/* Counter cards */}
          {isCounter && (
            <CounterCards todaysDeposit={todaysDeposit} />
          )}

          {/* Submitter cards */}
          {isSubmitter && submitterData && (
            <SubmitterCards
              activeCount={submitterData.count}
              recentItems={submitterData.items}
            />
          )}

          {/* Activity feed — full width */}
          <DashboardCard
            title="Recent Activity"
            icon="📰"
            accent="gray"
            className="md:col-span-2"
          >
            <ActivityFeed entries={activity} />
          </DashboardCard>
        </div>
      </div>
    </DashboardShell>
  );
}
