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
