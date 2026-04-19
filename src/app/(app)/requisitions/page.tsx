import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getByUser, getAll, getCountsByStatus, getPendingForSigner } from '@/lib/db/requisitions';
import { getBySignerRecent } from '@/lib/db/approvals';
import { Button } from '@/components/ui/button';
import { RequisitionList } from '@/components/requisitions/requisition-list';
import { TreasurerQueue } from '@/components/requisitions/treasurer-queue';
import { SignerQueue } from '@/components/requisitions/signer-queue';
import { CsvExport } from '@/components/requisitions/csv-export';

export const metadata: Metadata = { title: 'Requisitions' };

export default async function RequisitionsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const roles = auth.profile.role as string[];
  const isTreasurer = roles.includes('treasurer');
  const isSigner = roles.includes('signer');
  const isAdmin = roles.includes('admin');
  const hasElevatedRole = isTreasurer || isAdmin || isSigner;

  // Fetch all requisitions for elevated roles
  const requisitions = hasElevatedRole
    ? await getAll()
    : await getByUser(auth.profile.id);

  // Treasurer queue counts
  const counts = isTreasurer ? await getCountsByStatus() : {};

  // Signer data — always fetch if user has signer role, regardless of other roles
  const pendingForSigner = isSigner
    ? await getPendingForSigner(auth.profile.id)
    : [];
  const recentApprovals = isSigner
    ? await getBySignerRecent(auth.profile.id, 30)
    : [];

  // Determine primary view:
  // - Treasurer sees treasurer queue (with signer section if also a signer)
  // - Signer (non-treasurer) sees signer queue
  // - Admin (non-signer, non-treasurer) sees all requisitions
  // - Submitter sees own requisitions
  const showTreasurerQueue = isTreasurer;
  const showSignerQueue = isSigner && !isTreasurer;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
        <div className="flex gap-2">
          {(isTreasurer || isAdmin) && <CsvExport />}
          <Link href="/requisitions/templates">
            <Button variant="outline" className="h-12 text-base">
              Templates
            </Button>
          </Link>
        </div>
      </div>

      <Link href="/requisitions/new" className="block mb-6">
        <Button size="lg" className="w-full h-14 text-lg font-semibold">
          + New Requisition
        </Button>
      </Link>

      {/* If user is a signer (even with other roles), show signer queue first */}
      {isSigner && pendingForSigner.length > 0 && (
        <div className="mb-8">
          <SignerQueue pending={pendingForSigner} recentApprovals={recentApprovals} />
        </div>
      )}

      {/* Then show the role-appropriate main view */}
      {showTreasurerQueue ? (
        <TreasurerQueue requisitions={requisitions} counts={counts} />
      ) : showSignerQueue ? (
        // Signer-only users already see the queue above; show recent if no pending
        pendingForSigner.length === 0 ? (
          <SignerQueue pending={pendingForSigner} recentApprovals={recentApprovals} />
        ) : null
      ) : (
        <RequisitionList requisitions={requisitions} />
      )}
    </div>
  );
}
