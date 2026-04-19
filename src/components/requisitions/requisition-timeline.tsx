import { formatDateTime } from '@/lib/utils/dates';

type AuditEntry = {
  id: string;
  action: string;
  user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  user_name?: string;
};

type Props = {
  entries: AuditEntry[];
};

const ACTION_LABELS: Record<string, string> = {
  'requisition.submitted': 'Submitted',
  'requisition.cancelled': 'Cancelled',
  'requisition.prepared': 'Prepared & routed for approval',
  'requisition.returned': 'Returned to submitter',
  'requisition.resubmitted': 'Resubmitted',
  'requisition.approved': 'Approved',
  'requisition.rejected': 'Rejected',
  'requisition.paid': 'Marked as Paid',
};

export function RequisitionTimeline({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-gray-900">Activity</h2>
      <div className="space-y-0">
        {entries.map((entry, index) => {
          const label = ACTION_LABELS[entry.action] ?? entry.action;
          const userName = entry.user_name ?? 'System';
          const isLast = index === entries.length - 1;

          return (
            <div key={entry.id} className="flex gap-3">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-blue-600 mt-2 shrink-0" />
                {!isLast && <div className="w-0.5 flex-1 bg-gray-200" />}
              </div>
              {/* Content */}
              <div className="pb-4">
                <p className="text-lg text-gray-900">
                  <span className="font-semibold">{label}</span> by {userName}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDateTime(entry.created_at)}
                </p>
                {(entry.action === 'requisition.rejected' || entry.action === 'requisition.returned') &&
                  entry.details && 'reason' in entry.details && (
                  <p className="text-base text-orange-700 mt-1">
                    Reason: {String(entry.details.reason)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
