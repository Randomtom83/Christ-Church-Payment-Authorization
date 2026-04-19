'use client';

import { useRouter } from 'next/navigation';
import { useDashboardChanges } from '@/hooks/use-realtime';
import { useEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
};

/**
 * Wrapper that listens for realtime changes and refreshes the page.
 * Server components re-fetch fresh data on router.refresh().
 */
export function DashboardShell({ children }: Props) {
  const router = useRouter();
  const changeCount = useDashboardChanges();
  const prevCount = useRef(changeCount);

  useEffect(() => {
    // Skip the initial mount
    if (changeCount > prevCount.current) {
      router.refresh();
    }
    prevCount.current = changeCount;
  }, [changeCount, router]);

  return <>{children}</>;
}
