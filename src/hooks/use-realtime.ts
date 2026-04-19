'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Subscribe to realtime changes on the requisitions table.
 * Returns a counter that increments on every change, which can be used
 * as a dependency to trigger re-fetches.
 */
export function useRequisitionChanges() {
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('requisition-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requisitions',
        },
        () => {
          setChangeCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return changeCount;
}

/**
 * Get a live count of pending approval requisitions.
 * Re-queries on realtime changes.
 */
export function usePendingCount(enabled: boolean) {
  const [count, setCount] = useState(0);
  const changes = useRequisitionChanges();

  const fetchCount = useCallback(async () => {
    if (!enabled) return;
    const supabase = createClient();
    const { count: c } = await supabase
      .from('requisitions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_approval');

    setCount(c ?? 0);
  }, [enabled]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount, changes]);

  return count;
}

/**
 * Subscribe to changes on multiple tables.
 * Returns a counter that increments on any change across all tables.
 */
export function useDashboardChanges() {
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requisitions' }, () => setChangeCount((c) => c + 1))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => setChangeCount((c) => c + 1))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => setChangeCount((c) => c + 1))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_items' }, () => setChangeCount((c) => c + 1))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return changeCount;
}
