import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getByUser } from '@/lib/db/templates';
import { Button } from '@/components/ui/button';
import { TemplateList } from '@/components/requisitions/template-list';

export const metadata: Metadata = { title: 'Requisition Templates' };

export default async function RequisitionTemplatesPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const templates = await getByUser(auth.profile.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Templates</h1>
        <Link href="/requisitions">
          <Button variant="outline" className="h-12 text-base">
            Back
          </Button>
        </Link>
      </div>

      <TemplateList templates={templates} />
    </div>
  );
}
