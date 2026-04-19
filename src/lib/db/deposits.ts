import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export type Deposit = {
  id: string;
  deposit_date: string;
  counter_1_id: string;
  counter_2_id: string | null;
  total_checks: string;
  total_cash: string;
  total_amount: string;
  status: string;
  verified_at: string | null;
  verified_by: string | null;
  rejection_notes: string | null;
  recorded_in_qb: boolean;
  created_at: string;
  updated_at: string;
};

export type DepositWithDetails = Deposit & {
  counter_1: { id: string; full_name: string } | null;
  counter_2: { id: string; full_name: string } | null;
};

const DETAIL_SELECT = `
  *,
  counter_1:profiles!deposits_counter_1_id_fkey(id, full_name),
  counter_2:profiles!deposits_counter_2_id_fkey(id, full_name)
`;

const LIST_SELECT = `
  id, deposit_date, total_checks, total_cash, total_amount, status, created_at,
  counter_1:profiles!deposits_counter_1_id_fkey(id, full_name),
  counter_2:profiles!deposits_counter_2_id_fkey(id, full_name)
`;

/** Get a single deposit with counter profiles. */
export async function getById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('deposits')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .single();

  if (error) return null;
  return data as unknown as DepositWithDetails;
}

/** Find today's in-progress deposit for a counter (resume logic). */
export async function getTodayInProgress(counterId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('deposits')
    .select('id, status')
    .eq('counter_1_id', counterId)
    .eq('deposit_date', today)
    .eq('status', 'in_progress')
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

/** Get all deposits (treasurer/admin). */
export async function getAll() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('deposits')
    .select(LIST_SELECT)
    .order('deposit_date', { ascending: false });

  if (error) throw error;
  return data;
}

/** Get deposits a counter participated in. */
export async function getByCounter(counterId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('deposits')
    .select(LIST_SELECT)
    .or(`counter_1_id.eq.${counterId},counter_2_id.eq.${counterId}`)
    .order('deposit_date', { ascending: false });

  if (error) throw error;
  return data;
}

/** Get deposits pending verification (for Counter 2). */
export async function getPendingVerification() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('deposits')
    .select(LIST_SELECT)
    .eq('status', 'pending_verification')
    .order('deposit_date', { ascending: false });

  if (error) throw error;
  return data;
}

/** Create a new deposit. Uses admin client (auth checked in server action). */
export async function create(counterId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('deposits')
    .insert({
      counter_1_id: counterId,
      deposit_date: new Date().toISOString().split('T')[0],
      status: 'in_progress',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data as { id: string };
}

/** Update deposit totals (recalculated from items). */
export async function updateTotals(
  id: string,
  totals: { total_checks: number; total_cash: number; total_amount: number }
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('deposits')
    .update({
      ...totals,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

/** Update deposit status. */
export async function updateStatus(id: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('deposits')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

/** Record verification by Counter 2. */
export async function updateVerification(id: string, counter2Id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('deposits')
    .update({
      status: 'verified',
      counter_2_id: counter2Id,
      verified_by: counter2Id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

/** Reject verification — return to in_progress. */
export async function rejectVerification(id: string, notes: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('deposits')
    .update({
      status: 'in_progress',
      rejection_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}
