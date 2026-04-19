import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAll, getByCounter, getPendingVerification } from '@/lib/db/deposits';
import { Button } from '@/components/ui/button';
import { DepositList } from '@/components/deposits/deposit-list';

export const metadata: Metadata = { title: 'Deposits' };

export default async function DepositsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const roles = auth.profile.role as string[];
  const isCounter = roles.includes('counter');
  const isTreasurer = roles.includes('treasurer');
  const isAdmin = roles.includes('admin');

  // Fetch deposits based on role
  const deposits = (isTreasurer || isAdmin)
    ? await getAll()
    : isCounter
      ? await getByCounter(auth.profile.id)
      : [];

  // Check for pending verification deposits (any counter can verify)
  const pendingVerification = isCounter ? await getPendingVerification() : [];
  const pendingForMe = pendingVerification.filter((d) => {
    const c1 = Array.isArray(d.counter_1) ? d.counter_1[0] : d.counter_1;
    return c1?.id !== auth.profile.id;
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Deposits</h1>

      {isCounter && (
        <Link href="/deposits/new" className="block mb-6">
          <Button size="lg" className="w-full h-14 text-lg font-semibold">
            Start Counting
          </Button>
        </Link>
      )}

      {/* Pending verification callout */}
      {pendingForMe.length > 0 && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-lg font-semibold text-amber-800 mb-2">
            {pendingForMe.length} deposit{pendingForMe.length !== 1 ? 's' : ''} waiting for verification
          </p>
          {pendingForMe.map((d) => (
            <Link key={d.id} href={`/deposits/${d.id}`}>
              <Button variant="outline" size="lg" className="w-full h-12 text-base mb-2 border-amber-300">
                Verify deposit from {d.deposit_date}
              </Button>
            </Link>
          ))}
        </div>
      )}

      <DepositList deposits={deposits} />
    </div>
  );
}
