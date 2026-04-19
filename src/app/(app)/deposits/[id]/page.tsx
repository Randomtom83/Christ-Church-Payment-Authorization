import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getById } from '@/lib/db/deposits';
import { getByDeposit, getTotalsByCategory } from '@/lib/db/deposit-items';
import { getAll as getAllMembers } from '@/lib/db/members';
import { getSignedUrl } from '@/lib/db/attachments';
import { CounterEntry } from '@/components/deposits/counter-entry';
import { DepositSummary } from '@/components/deposits/deposit-summary';
import { DepositSlipInfo } from '@/components/deposits/deposit-slip-info';
import { VerificationActions } from '@/components/deposits/verification-actions';
import { StatusBadge } from '@/components/requisitions/status-badge';

export const metadata: Metadata = { title: 'Deposit' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
};

export default async function DepositDetailPage({ params, searchParams }: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const { id } = await params;
  const { submitted } = await searchParams;

  const deposit = await getById(id);
  if (!deposit) notFound();

  const items = await getByDeposit(id);
  const roles = auth.profile.role as string[];
  const isCounter = roles.includes('counter') || roles.includes('admin');
  const isCounter1 = deposit.counter_1_id === auth.profile.id;

  // Get signed URLs for check images
  const imageUrls: Record<string, string> = {};
  for (const item of items) {
    if (item.check_image_path && item.check_image_path !== 'pending-upload') {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data } = await supabase.storage
          .from('attachments')
          .createSignedUrl(item.check_image_path, 3600);
        if (data) imageUrls[item.id] = data.signedUrl;
      } catch {
        // Skip
      }
    }
  }

  // In-progress: show counter entry (only for Counter 1)
  if (deposit.status === 'in_progress' && isCounter1) {
    const members = await getAllMembers();
    return (
      <CounterEntry
        depositId={id}
        initialItems={items}
        members={members}
        imageUrls={imageUrls}
      />
    );
  }

  // All other statuses: show summary
  const totals = await getTotalsByCategory(id);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      {submitted === 'true' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4" role="status">
          <p className="text-lg text-green-800 font-semibold">
            Deposit submitted for verification!
          </p>
        </div>
      )}

      {deposit.rejection_notes && deposit.status === 'in_progress' && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
          <p className="text-lg font-semibold text-orange-800">Verification was rejected</p>
          <p className="text-base text-orange-700 mt-1">{deposit.rejection_notes}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Deposit</h1>
        <StatusBadge status={deposit.status} />
      </div>

      <DepositSummary deposit={deposit} items={items} imageUrls={imageUrls} />

      {/* Verification actions for Counter 2 */}
      {deposit.status === 'pending_verification' && isCounter && (
        <VerificationActions
          depositId={id}
          currentUserId={auth.profile.id}
          counter1Id={deposit.counter_1_id}
        />
      )}

      {/* Bank slip info for verified deposits */}
      {(deposit.status === 'verified' || deposit.status === 'recorded') && (
        <DepositSlipInfo
          totalChecks={totals.totalChecks}
          checkCount={totals.checkCount}
          totalCash={totals.totalCash}
          totalDeposit={totals.totalAmount}
        />
      )}
    </div>
  );
}
