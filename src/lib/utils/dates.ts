import { format, formatDistanceToNow } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const APP_TIMEZONE = 'America/New_York';

/** Format a date as "Apr 18, 2026" in Eastern time */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const zoned = toZonedTime(d, APP_TIMEZONE);
  return format(zoned, 'MMM d, yyyy');
}

/** Format a date as "Apr 18, 2026 at 2:30 PM" in Eastern time */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const zoned = toZonedTime(d, APP_TIMEZONE);
  return format(zoned, "MMM d, yyyy 'at' h:mm a");
}

/** Format as relative time: "2 hours ago", "Yesterday", etc. */
export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}
