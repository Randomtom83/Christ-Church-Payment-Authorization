import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getById } from '@/lib/db/requisitions';
import { getAll as getAllAccounts } from '@/lib/db/accounts';
import { EditRequisitionForm } from '@/components/requisitions/edit-requisition-form';

export const metadata: Metadata = { title: 'Edit Requisition' };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditRequisitionPage({ params }: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const { id } = await params;
  const requisition = await getById(id);

  if (!requisition) notFound();

  // Only the submitter can edit, and only when returned
  if (requisition.submitted_by !== auth.profile.id) {
    redirect(`/requisitions/${id}`);
  }
  if (requisition.status !== 'returned') {
    redirect(`/requisitions/${id}`);
  }

  const accounts = await getAllAccounts();

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Edit Requisition #{requisition.req_number}
      </h1>
      <EditRequisitionForm requisition={requisition} accounts={accounts} />
    </div>
  );
}
