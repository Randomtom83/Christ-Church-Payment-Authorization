import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAll as getAllAccounts } from '@/lib/db/accounts';
import { getAll as getAllVendors } from '@/lib/db/vendors';
import { getById as getTemplateById } from '@/lib/db/templates';
import { RequisitionForm } from '@/components/requisitions/requisition-form';

export const metadata: Metadata = { title: 'New Requisition' };

type Props = {
  searchParams: Promise<{ template?: string }>;
};

export default async function NewRequisitionPage({ searchParams }: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const params = await searchParams;

  // Fetch accounts and vendors in parallel
  const [accounts, vendors] = await Promise.all([
    getAllAccounts(),
    getAllVendors(),
  ]);

  // If a template ID is provided, pre-fill the form
  let templateData = null;
  if (params.template) {
    const template = await getTemplateById(params.template);
    if (template && template.created_by === auth.profile.id) {
      templateData = {
        entity: template.entity,
        payee_name: template.payee_name,
        vendor_id: template.vendor_id ?? undefined,
        amount: template.amount ?? undefined,
        account_id: template.account_id,
        payment_method: template.payment_method,
        description: template.description ?? undefined,
      };
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        New Requisition
      </h1>
      <RequisitionForm
        accounts={accounts}
        vendors={vendors}
        templateData={templateData}
      />
    </div>
  );
}
