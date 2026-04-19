import { Card, CardContent } from '@/components/ui/card';

type Accent = 'blue' | 'green' | 'amber' | 'gray';

type Props = {
  title: string;
  icon?: string;
  accent?: Accent;
  children: React.ReactNode;
  className?: string;
};

const BORDER_COLORS: Record<Accent, string> = {
  blue: 'border-l-blue-600',
  green: 'border-l-green-600',
  amber: 'border-l-amber-500',
  gray: 'border-l-gray-300',
};

export function DashboardCard({ title, icon, accent = 'gray', children, className }: Props) {
  return (
    <Card className={`border-l-4 ${BORDER_COLORS[accent]} ${className ?? ''}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          {icon && <span className="text-xl" aria-hidden="true">{icon}</span>}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
