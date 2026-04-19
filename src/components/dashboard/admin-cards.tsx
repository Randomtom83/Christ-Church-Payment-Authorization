import { DashboardCard } from '@/components/dashboard/dashboard-card';

type Props = {
  health: {
    activeUsers: number;
    accountsLoaded: number;
    vendorsLoaded: number;
    lastDepositDate: string | null;
    emailConfigured: boolean;
  };
};

export function AdminCards({ health }: Props) {
  return (
    <DashboardCard title="System Health" icon="⚙️" accent="gray">
      <div className="space-y-2">
        <Row label="Active Users" value={String(health.activeUsers)} />
        <Row label="Accounts Loaded" value={String(health.accountsLoaded)} />
        <Row label="Vendors Loaded" value={String(health.vendorsLoaded)} />
        <Row label="Last Deposit" value={health.lastDepositDate ?? 'None yet'} />
        <Row
          label="Email Notifications"
          value={health.emailConfigured ? 'Configured' : 'Not configured'}
          warn={!health.emailConfigured}
        />
      </div>
    </DashboardCard>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between text-base">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${warn ? 'text-amber-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
