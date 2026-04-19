import { formatDateTime } from '@/lib/utils/dates';
import { DUAL_APPROVAL_THRESHOLD } from '@/lib/constants';

type ApprovalInfo = {
  id: string;
  action: string;
  notes: string | null;
  signed_at: string;
  signer: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
};

type Props = {
  amount: string;
  approvals: ApprovalInfo[];
  status: string;
};

export function ApprovalStatus({ amount, approvals, status }: Props) {
  const amountNum = parseFloat(amount);
  const required = amountNum >= DUAL_APPROVAL_THRESHOLD ? 2 : 1;
  const approved = approvals.filter((a) => a.action === 'approved');
  const rejected = approvals.find((a) => a.action === 'rejected');

  const getSignerName = (a: ApprovalInfo) => {
    if (!a.signer) return 'Unknown';
    if (Array.isArray(a.signer)) return a.signer[0]?.full_name ?? 'Unknown';
    return a.signer.full_name;
  };

  if (status === 'submitted' || status === 'returned') return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        Approval Status
      </h3>

      <div className="flex items-center gap-3">
        <span className="text-base text-gray-600">
          {required === 1 ? '1 signature required' : '2 signatures required'}
          {amountNum >= DUAL_APPROVAL_THRESHOLD && (
            <span className="text-sm text-gray-500"> (amount &ge; $500)</span>
          )}
        </span>
      </div>

      {/* Approval slots */}
      <div className="space-y-2">
        {Array.from({ length: required }).map((_, i) => {
          const approval = approved[i];
          if (approval) {
            return (
              <div key={approval.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <span className="text-green-600 text-xl" aria-hidden="true">✓</span>
                <div>
                  <p className="text-base font-medium text-green-800">
                    {getSignerName(approval)}
                  </p>
                  <p className="text-sm text-green-600">
                    {formatDateTime(approval.signed_at)}
                  </p>
                </div>
              </div>
            );
          }
          return (
            <div key={`pending-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-gray-300 text-xl" aria-hidden="true">○</span>
              <p className="text-base text-gray-500">
                {status === 'pending_approval' ? 'Awaiting signature' : 'Not required'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Rejection notice */}
      {rejected && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-xl" aria-hidden="true">✕</span>
            <div>
              <p className="text-base font-medium text-red-800">
                Rejected by {getSignerName(rejected)}
              </p>
              <p className="text-sm text-red-600">
                {formatDateTime(rejected.signed_at)}
              </p>
              {rejected.notes && (
                <p className="text-base text-red-700 mt-1">
                  Reason: {String(rejected.notes)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
