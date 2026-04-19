import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/** Count of pending_approval requisitions a signer hasn't acted on. */
export async function getPendingForSignerCount(signerId: string) {
  const supabase = await createClient();

  const { data: reqs } = await supabase
    .from('requisitions')
    .select('id, amount')
    .eq('status', 'pending_approval');

  if (!reqs || reqs.length === 0) return { count: 0, totalDollars: 0 };

  const { data: acted } = await supabase
    .from('approvals')
    .select('requisition_id')
    .eq('signer_id', signerId);

  const actedIds = new Set((acted ?? []).map((a) => a.requisition_id));
  const pending = reqs.filter((r) => !actedIds.has(r.id));

  const totalDollars = pending.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  return { count: pending.length, totalDollars };
}

/** Counts for treasurer queue tabs. */
export async function getTreasurerCounts() {
  const supabase = await createClient();
  const statuses = ['submitted', 'pending_approval', 'approved', 'paid'] as const;
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const { count } = await supabase
      .from('requisitions')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    counts[status] = count ?? 0;
  }

  return counts;
}

/** Get today's deposit(s). */
export async function getTodaysDeposit() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('deposits')
    .select(`
      id, deposit_date, total_checks, total_cash, total_amount, status,
      counter_1:profiles!deposits_counter_1_id_fkey(id, full_name),
      counter_2:profiles!deposits_counter_2_id_fkey(id, full_name)
    `)
    .eq('deposit_date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

/** Get category breakdown for a deposit. */
export async function getDepositCategoryBreakdown(depositId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('deposit_items')
    .select('category_label, amount')
    .eq('deposit_id', depositId);

  if (!data) return {};

  const totals: Record<string, number> = {};
  for (const item of data) {
    const label = item.category_label ?? 'Uncategorized';
    totals[label] = (totals[label] ?? 0) + parseFloat(item.amount);
  }
  return totals;
}

/** Recent activity from audit log. */
export async function getRecentActivity(limit: number = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('audit_log')
    .select('id, action, user_id, entity_type, entity_id, details, created_at')
    .in('action', [
      'requisition.submitted', 'requisition.prepared', 'requisition.approved',
      'requisition.rejected', 'requisition.paid', 'requisition.cancelled',
      'deposit.created', 'deposit.verified',
    ])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  // Enrich with user names
  const userIds = [...new Set(data.map((e) => e.user_id).filter(Boolean))] as string[];
  let userMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    if (profiles) {
      userMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]));
    }
  }

  return data.map((e) => ({
    ...e,
    user_name: e.user_id ? userMap[e.user_id] ?? 'Unknown' : 'System',
  }));
}

/** Weekly summary for treasurer. */
export async function getWeeklySummary() {
  const supabase = await createClient();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count: reqsProcessed } = await supabase
    .from('requisitions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'paid')
    .gte('paid_at', weekAgo.toISOString());

  const { data: paidReqs } = await supabase
    .from('requisitions')
    .select('amount')
    .eq('status', 'paid')
    .gte('paid_at', weekAgo.toISOString());

  const totalPaid = (paidReqs ?? []).reduce((sum, r) => sum + parseFloat(r.amount), 0);

  const { data: deposits } = await supabase
    .from('deposits')
    .select('total_amount')
    .in('status', ['verified', 'recorded'])
    .gte('deposit_date', weekAgo.toISOString().split('T')[0]);

  const totalDeposits = (deposits ?? []).reduce((sum, d) => sum + parseFloat(d.total_amount), 0);

  return {
    requisitionsProcessed: reqsProcessed ?? 0,
    totalPaid,
    totalDeposits,
  };
}

/** Active (non-terminal) requisitions for a submitter. */
export async function getUserActiveRequisitions(userId: string) {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from('requisitions')
    .select('id, req_number, payee_name, amount, status, submitted_at', { count: 'exact' })
    .eq('submitted_by', userId)
    .not('status', 'in', '("paid","cancelled","rejected","recorded")')
    .order('submitted_at', { ascending: false })
    .limit(3);

  return { items: data ?? [], count: count ?? 0 };
}

/** System health for admin. */
export async function getSystemHealth() {
  const admin = createAdminClient();

  const { count: users } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: accounts } = await admin
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: vendors } = await admin
    .from('vendors')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { data: lastDeposit } = await admin
    .from('deposits')
    .select('deposit_date')
    .order('deposit_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const emailConfigured = !!process.env.RESEND_API_KEY;

  return {
    activeUsers: users ?? 0,
    accountsLoaded: accounts ?? 0,
    vendorsLoaded: vendors ?? 0,
    lastDepositDate: lastDeposit?.deposit_date ?? null,
    emailConfigured,
  };
}
