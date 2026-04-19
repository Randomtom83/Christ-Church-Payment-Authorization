import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { APP_TIMEZONE } from '@/lib/constants';

type Props = {
  name: string;
};

export function Greeting({ name }: Props) {
  const now = toZonedTime(new Date(), APP_TIMEZONE);
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday

  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  const dateStr = format(now, 'EEEE, MMMM d, yyyy');

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {greeting}, {name.split(' ')[0]}
      </h1>
      <p className="text-base text-gray-600 mt-1">{dateStr}</p>
      {dayOfWeek === 0 && (
        <p className="text-sm font-medium text-blue-600 mt-1">Sunday Service Day</p>
      )}
    </div>
  );
}
