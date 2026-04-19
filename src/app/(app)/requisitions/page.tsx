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

  // Determine which view to show (treasurer takes priority over signer)
  const showTreasurerQueue = isTreasurer;
  const showSignerQueue = isSigner && !isTreasurer;

  // Fetch data based on role
  const requisitions = hasElevatedRole
    ? await getAll()
    : await getByUser(auth.profile.id);

  const counts = isTreasurer ? await getCountsByStatus() : {};

  // Signer-specific data
  const pendingForSigner = showSignerQueue
    ? await getPendingForSigner(auth.profile.id)
    : [];
  const recentApprovals = showSignerQueue
    ? await getBySignerRecent(auth.profile.id, 30)
    : [];

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

      {showTreasurerQueue ? (
        <TreasurerQueue requisitions={requisitions} counts={counts} />
      ) : showSignerQueue ? (
        <SignerQueue pending={pendingForSigner} recentApprovals={recentApprovals} />
      ) : (
        <RequisitionList requisitions={requisitions} />
      )}
    </div>
  );
}
