import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createOrResumeDeposit } from '@/lib/actions/deposits';

export const metadata: Metadata = { title: 'New Deposit' };

export default async function NewDepositPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const roles = auth.profile.role as string[];
  if (!roles.includes('counter') && !roles.includes('admin')) {
    redirect('/deposits');
  }

  // Create or resume today's deposit
  const result = await createOrResumeDeposit();

  if (result.success && result.depositId) {
    redirect(`/deposits/${result.depositId}`);
  }

  // If creation failed, show error
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-lg text-red-800">
          {result.error ?? 'Failed to start deposit session. Please try again.'}
        </p>
      </div>
    </div>
  );
}
