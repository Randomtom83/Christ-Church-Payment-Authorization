'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/requisitions/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cancelRequisition } from '@/lib/actions/requisitions';
import { formatDollars } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/dates';
import type { RequisitionWithDetails } from '@/lib/db/requisitions';

type Props = {
  requisition: RequisitionWithDetails;
  currentUserId: string;
  attachmentUrls: Record<string, string>;
};

export function RequisitionDetail({ requisition, currentUserId, attachmentUrls }: Props) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCancel =
    requisition.submitted_by === currentUserId &&
    requisition.status === 'submitted';

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this requisition?')) return;
    setIsCancelling(true);
    setError(null);

    const result = await cancelRequisition(requisition.id);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Failed to cancel');
      setIsCancelling(false);
    }
  };

  const entityLabel =
    requisition.entity === 'church' ? 'Christ Church' : 'Nursery School';

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4" role="alert">
          <p className="text-lg text-red-800">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-xl">
            Requisition #{requisition.req_number}
          </CardTitle>
          <StatusBadge status={requisition.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailRow label="Entity" value={entityLabel} />
          <DetailRow label="Payee" value={requisition.payee_name} />
          <DetailRow label="Amount" value={formatDollars(requisition.amount)} />
          <DetailRow
            label="Account"
            value={
              requisition.account
                ? `${requisition.account.name} (${requisition.account.code})`
                : '—'
            }
          />
          <DetailRow
            label="Category"
            value={requisition.account?.category ?? '—'}
          />
          <DetailRow
            label="Payment Method"
            value={requisition.payment_method === 'check' ? 'Check' : 'Online Payment'}
          />
          <DetailRow label="Description" value={requisition.description} />
          <DetailRow
            label="Submitted by"
            value={requisition.submitter?.full_name ?? '—'}
          />
          <DetailRow
            label="Submitted"
            value={formatDateTime(requisition.submitted_at)}
          />
          {requisition.check_number && (
            <DetailRow label="Check #" value={requisition.check_number} />
          )}
          {requisition.prepared_notes && (
            <DetailRow label="Treasurer Notes" value={requisition.prepared_notes} />
          )}
          {requisition.payment_date && (
            <DetailRow label="Payment Date" value={formatDateTime(requisition.payment_date)} />
          )}
          {requisition.payment_reference && (
            <DetailRow label="Payment Reference" value={requisition.payment_reference} />
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      {requisition.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {requisition.attachments.map((att) => {
                const url = attachmentUrls[att.id];
                const isImage = att.file_type === 'receipt' || att.file_name.match(/\.(jpg|jpeg|png|webp|heic)$/i);
                return (
                  <a
                    key={att.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-gray-200 overflow-hidden aspect-square bg-gray-50 hover:border-blue-400 transition-colors"
                  >
                    {isImage && url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={att.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-3">
                        <span className="text-3xl">📄</span>
                        <p className="text-sm text-gray-600 truncate mt-2 max-w-full">
                          {att.file_name}
                        </p>
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel button */}
      {canCancel && (
        <Button
          variant="destructive"
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          onClick={handleCancel}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <>
              <LoadingSpinner className="mr-2 h-5 w-5" />
              Cancelling...
            </>
          ) : (
            'Cancel Requisition'
          )}
        </Button>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
      <span className="text-base font-medium text-gray-600">{label}</span>
      <span className="text-lg text-gray-900">{value}</span>
    </div>
  );
}
