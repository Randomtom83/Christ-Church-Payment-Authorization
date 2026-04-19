import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type Requisition = {
  id: string;
  req_number: number;
  template_id: string | null;
  submitted_by: string;
  submitted_at: string;
  vendor_id: string | null;
  payee_name: string;
  amount: string; // DECIMAL comes back as string from Supabase
  entity: string;
  account_id: string;
  payment_method: string;
  description: string;
  check_number: string | null;
  status: string;
  prepared_by: string | null;
  prepared_at: string | null;
  requires_dual_approval: boolean;
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RequisitionWithDetails = Requisition & {
  account: { id: string; name: string; code: string; category: string } | null;
  vendor: { id: string; name: string } | null;
  submitter: { id: string; full_name: string } | null;
  attachments: Array<{
    id: string;
    file_path: string;
    file_name: string;
    file_type: string;
    file_size: number | null;
  }>;
};

const DETAIL_SELECT = `
  *,
  account:accounts(id, name, code, category),
  vendor:vendors(id, name),
  submitter:profiles!requisitions_submitted_by_fkey(id, full_name),
  attachments(id, file_path, file_name, file_type, file_size)
`;

const LIST_SELECT = `
  id, req_number, payee_name, amount, entity, status, submitted_at, payment_method,
  account:accounts(id, name, category),
  submitter:profiles!requisitions_submitted_by_fkey(id, full_name)
`;

/** Get a single requisition with all related data. */
export async function getById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('requisitions')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .single();

  if (error) return null;
  return data as unknown as RequisitionWithDetails;
}

/** Get requisitions submitted by a specific user. */
export async function getByUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('requisitions')
    .select(LIST_SELECT)
    .eq('submitted_by', userId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

/** Get all requisitions (for treasurer, admin). */
export async function getAll() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('requisitions')
    .select(LIST_SELECT)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

/** Insert a new requisition. Returns the new row. */
export async function create(data: {
  submitted_by: string;
  payee_name: string;
  vendor_id?: string | null;
  amount: number;
  entity: string;
  account_id: string | null;
  payment_method: string;
  description: string;
  template_id?: string | null;
}) {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('requisitions')
    .insert({
      ...data,
      status: 'submitted',
    })
    .select('id, req_number')
    .single();

  if (error) throw error;
  return row as { id: string; req_number: number };
}

/** Update requisition status. */
export async function updateStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('requisitions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}
