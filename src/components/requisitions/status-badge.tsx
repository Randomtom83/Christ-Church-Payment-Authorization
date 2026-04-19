import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  submitted: { label: 'Submitted', icon: '📋', variant: 'default' },
  prepared: { label: 'Prepared', icon: '📝', variant: 'secondary' },
  pending_approval: { label: 'Pending Approval', icon: '⏳', variant: 'secondary' },
  approved: { label: 'Approved', icon: '✓', variant: 'default' },
  paid: { label: 'Paid', icon: '💵', variant: 'default' },
  rejected: { label: 'Rejected', icon: '✕', variant: 'destructive' },
  returned: { label: 'Returned', icon: '↩', variant: 'secondary' },
  cancelled: { label: 'Cancelled', icon: '—', variant: 'outline' },
  recorded: { label: 'Recorded', icon: '✓', variant: 'default' },
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    icon: '?',
    variant: 'outline' as const,
  };

  // Map to color classes for accessibility (icon + color + text)
  const colorClasses: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    prepared: 'bg-amber-100 text-amber-800 border-amber-200',
    pending_approval: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    returned: 'bg-orange-100 text-orange-800 border-orange-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
    recorded: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <Badge
      variant={config.variant}
      className={`${colorClasses[status] ?? ''} text-sm font-medium ${className ?? ''}`}
    >
      <span className="mr-1" aria-hidden="true">
        {config.icon}
      </span>
      {config.label}
    </Badge>
  );
}
