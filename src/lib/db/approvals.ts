import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type Approval = {
  id: string;
  requisition_id: string;
  signer_id: string;
  action: string; // "approved" or "rejected"
  notes: string | null;
  signed_at: string;
};

export type ApprovalWithSigner = Approval & {
  signer: { id: string; full_name: string } | null;
};

/** Get all approvals for a requisition. */
export async function getByRequisition(requisitionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('approvals')
    .select('*, signer:profiles!approvals_signer_id_fkey(id, full_name)')
    .eq('requisition_id', requisitionId)
    .order('signed_at', { ascending: true });

  if (error) throw error;
  return data as unknown as ApprovalWithSigner[];
}

/** Get recent approvals by a specific signer (last N days). */
export async function getBySignerRecent(signerId: string, days: number = 30) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('approvals')
    .select(`
      *,
      requisition:requisitions(id, req_number, payee_name, amount, entity, status)
    `)
    .eq('signer_id', signerId)
    .gte('signed_at', since.toISOString())
    .order('signed_at', { ascending: false });

  if (error) throw error;
  return data;
}

/** Check if a signer has already acted on a requisition. */
export async function hasSignerActed(requisitionId: string, signerId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('approvals')
    .select('*', { count: 'exact', head: true })
    .eq('requisition_id', requisitionId)
    .eq('signer_id', signerId);

  if (error) return false;
  return (count ?? 0) > 0;
}

/** Count approved approvals for a requisition. */
export async function countApproved(requisitionId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('approvals')
    .select('*', { count: 'exact', head: true })
    .eq('requisition_id', requisitionId)
    .eq('action', 'approved');

  if (error) return 0;
  return count ?? 0;
}

/** Process an approval atomically via the Postgres function. */
export async function processApproval(
  requisitionId: string,
  signerId: string,
  action: 'approved' | 'rejected',
  notes?: string | null
): Promise<{ success: boolean; error?: string; new_status?: string; approvals_count?: number; approvals_required?: number }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('process_approval', {
    p_requisition_id: requisitionId,
    p_signer_id: signerId,
    p_action: action,
    p_notes: notes ?? null,
  });

  if (error) {
    // RPC not found — fall back to non-atomic approach
    if (error.code === '42883') {
      return { success: false, error: 'Approval function not available. Run migration 008.' };
    }
    return { success: false, error: error.message };
  }

  // data is the jsonb result from the function
  const result = data as { success: boolean; error?: string; new_status?: string; approvals_count?: number; approvals_required?: number };
  return result;
}
