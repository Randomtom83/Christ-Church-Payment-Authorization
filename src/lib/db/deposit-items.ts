import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export type DepositItem = {
  id: string;
  deposit_id: string;
  item_type: string;
  amount: string;
  account_id: string | null;
  is_pledge_payment: boolean;
  member_name: string | null;
  giving_number: string | null;
  check_number: string | null;
  check_image_path: string | null;
  denomination_counts: Record<string, number> | null;
  category_label: string | null;
  notes: string | null;
  created_at: string;
};

/** Get all items for a deposit. */
export async function getByDeposit(depositId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('deposit_items')
    .select('*')
    .eq('deposit_id', depositId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as DepositItem[];
}

/** Create a deposit item. Uses admin client to bypass RLS (auth checked in server action). */
export async function create(data: {
  deposit_id: string;
  item_type: string;
  amount: number;
  account_id?: string | null;
  is_pledge_payment?: boolean;
  member_name?: string | null;
  giving_number?: string | null;
  check_number?: string | null;
  check_image_path?: string | null;
  denomination_counts?: Record<string, number> | null;
  category_label?: string | null;
  notes?: string | null;
}) {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from('deposit_items')
    .insert(data)
    .select('id')
    .single();

  if (error) throw error;
  return row as { id: string };
}

/** Update a deposit item. */
export async function update(
  id: string,
  data: Partial<{
    amount: number;
    account_id: string | null;
    is_pledge_payment: boolean;
    member_name: string | null;
    giving_number: string | null;
    check_number: string | null;
    check_image_path: string | null;
    denomination_counts: Record<string, number> | null;
    category_label: string | null;
    notes: string | null;
  }>
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('deposit_items')
    .update(data)
    .eq('id', id);

  if (error) throw error;
}

/** Delete a deposit item. */
export async function remove(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('deposit_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/** Get totals grouped by category for a deposit. */
export async function getTotalsByCategory(depositId: string) {
  const items = await getByDeposit(depositId);

  const categoryTotals: Record<string, number> = {};
  let totalChecks = 0;
  let totalCash = 0;

  for (const item of items) {
    const amount = parseFloat(item.amount);
    const label = item.category_label ?? 'Uncategorized';

    categoryTotals[label] = (categoryTotals[label] ?? 0) + amount;

    if (item.item_type === 'check') {
      totalChecks += amount;
    } else if (item.item_type === 'cash' || item.item_type === 'coin') {
      totalCash += amount;
    }
  }

  return {
    categoryTotals,
    totalChecks,
    totalCash,
    totalAmount: totalChecks + totalCash,
    checkCount: items.filter((i) => i.item_type === 'check').length,
  };
}
