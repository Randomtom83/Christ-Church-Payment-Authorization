import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getByUser, getAll } from '@/lib/db/requisitions';
import { Button } from '@/components/ui/button';
import { RequisitionList } from '@/components/requisitions/requisition-list';

export const metadata: Metadata = { title: 'Requisitions' };

export default async function RequisitionsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const roles = auth.profile.role as string[];
  const hasElevatedRole = roles.some((r) =>
    ['treasurer', 'signer', 'admin'].includes(r)
  );

  // Elevated roles see all requisitions; submitters see only their own
  const requisitions = hasElevatedRole
    ? await getAll()
    : await getByUser(auth.profile.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
        <Link href="/requisitions/templates">
          <Button variant="outline" className="h-12 text-base">
            My Templates
          </Button>
        </Link>
      </div>

      <Link href="/requisitions/new" className="block mb-6">
        <Button size="lg" className="w-full h-14 text-lg font-semibold">
          + New Requisition
        </Button>
      </Link>

      <RequisitionList requisitions={requisitions} />
    </div>
  );
}
