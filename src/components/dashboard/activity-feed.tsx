import Link from 'next/link';
import { formatRelative } from '@/lib/utils/dates';

type ActivityEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  user_name: string;
};

type Props = {
  entries: ActivityEntry[];
};

const ACTION_DISPLAY: Record<string, { icon: string; verb: string }> = {
  'requisition.submitted': { icon: '📋', verb: 'submitted' },
  'requisition.prepared': { icon: '📝', verb: 'prepared' },
  'requisition.approved': { icon: '✓', verb: 'approved' },
  'requisition.rejected': { icon: '✕', verb: 'rejected' },
  'requisition.paid': { icon: '💵', verb: 'marked as paid' },
  'requisition.cancelled': { icon: '—', verb: 'cancelled' },
  'deposit.created': { icon: '🏦', verb: 'started a deposit' },
  'deposit.verified': { icon: '✓', verb: 'verified a deposit' },
};

export function ActivityFeed({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="text-base text-gray-500">No recent activity.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const display = ACTION_DISPLAY[entry.action] ?? { icon: '•', verb: entry.action };
        const details = entry.details as Record<string, unknown> | null;
        const payee = details?.payee_name as string | undefined;
        const amount = details?.amount;
        const reqNum = details?.req_number;

        let description = `${entry.user_name} ${display.verb}`;
        if (reqNum) description += ` Req #${reqNum}`;
        if (payee && amount) description += ` — $${Number(amount).toFixed(2)} to ${payee}`;
        else if (amount) description += ` — $${Number(amount).toFixed(2)}`;

        const href = entry.entity_id
          ? entry.entity_type === 'deposit'
            ? `/deposits/${entry.entity_id}`
            : `/requisitions/${entry.entity_id}`
          : '#';

        return (
          <Link key={entry.id} href={href} className="block">
            <div className="flex items-start gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2">
              <span className="text-lg mt-0.5 shrink-0" aria-hidden="true">
                {display.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base text-gray-900 leading-snug">{description}</p>
                <p className="text-sm text-gray-500">{formatRelative(entry.created_at)}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
