'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { deleteTemplate } from '@/lib/actions/templates';
import { formatDollars } from '@/lib/utils/currency';
import type { TemplateWithAccount } from '@/lib/db/templates';

type Props = {
  templates: TemplateWithAccount[];
};

export function TemplateList({ templates }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-500 mb-2">No templates yet</p>
        <p className="text-lg text-gray-400">
          Create one by checking &quot;Save as reusable template&quot; when submitting a requisition.
        </p>
      </div>
    );
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    setDeletingId(id);
    const result = await deleteTemplate(id);
    if (result.success) {
      router.refresh();
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <Card key={t.id}>
          <CardContent className="py-4 px-4">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-gray-900 truncate">
                  {t.name}
                </p>
                <p className="text-base text-gray-600">{t.payee_name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {t.account?.name ?? 'No account'} &middot;{' '}
                  {t.amount ? formatDollars(t.amount) : 'Amount varies'}
                </p>
                {t.use_count > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    Used {t.use_count} time{t.use_count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link href={`/requisitions/new?template=${t.id}`}>
                  <Button size="lg" className="h-12 text-base font-semibold">
                    Use
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-sm text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(t.id, t.name)}
                  disabled={deletingId === t.id}
                >
                  {deletingId === t.id ? (
                    <LoadingSpinner className="h-4 w-4" />
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
