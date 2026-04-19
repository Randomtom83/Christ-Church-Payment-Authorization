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
  account_id: string | null;
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
  returned_reason: string | null;
  payment_date: string | null;
  payment_reference: string | null;
  prepared_notes: string | null;
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

/** Get pending requisitions that a signer hasn't acted on yet. */
export async function getPendingForSigner(signerId: string) {
  const supabase = await createClient();

  // Get all pending_approval requisitions
  const { data: reqs, error: reqError } = await supabase
    .from('requisitions')
    .select(LIST_SELECT)
    .eq('status', 'pending_approval')
    .order('submitted_at', { ascending: true });

  if (reqError) throw reqError;
  if (!reqs || reqs.length === 0) return [];

  // Get this signer's existing approvals
  const { data: myApprovals } = await supabase
    .from('approvals')
    .select('requisition_id')
    .eq('signer_id', signerId);

  const actedOn = new Set((myApprovals ?? []).map((a) => a.requisition_id));

  // Filter: exclude already acted on AND exclude own submissions
  return reqs.filter(
    (r) => !actedOn.has(r.id) && r.submitter &&
      (Array.isArray(r.submitter) ? r.submitter[0]?.id !== signerId : (r.submitter as { id: string }).id !== signerId)
  );
}

/** Get requisitions filtered by status. */
export async function getByStatus(status: string, ascending = true) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('requisitions')
    .select(LIST_SELECT)
    .eq('status', status)
    .order('submitted_at', { ascending });

  if (error) throw error;
  return data;
}

/** Get counts for each status (for queue badges). */
export async function getCountsByStatus() {
  const supabase = await createClient();
  const statuses = ['submitted', 'pending_approval', 'approved', 'paid', 'returned'];
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const { count, error } = await supabase
      .from('requisitions')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    counts[status] = error ? 0 : (count ?? 0);
  }

  return counts;
}

/** Prepare a requisition for approval (treasurer action). */
export async function updatePrepare(
  id: string,
  data: {
    account_id: string;
    check_number?: string | null;
    prepared_notes?: string | null;
    prepared_by: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('requisitions')
    .update({
      account_id: data.account_id,
      check_number: data.check_number ?? null,
      prepared_notes: data.prepared_notes ?? null,
      prepared_by: data.prepared_by,
      prepared_at: new Date().toISOString(),
      status: 'pending_approval',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

/** Return a requisition to the submitter (treasurer action). */
export async function updateReturn(id: string, reason: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('requisitions')
    .update({
      status: 'returned',
      returned_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

/** Mark a requisition as paid (treasurer action). */
export async function updatePaid(
  id: string,
  data: {
    payment_date: string;
    payment_reference?: string | null;
    paid_by: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('requisitions')
    .update({
      status: 'paid',
      payment_date: data.payment_date,
      payment_reference: data.payment_reference ?? null,
      paid_by: data.paid_by,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

/** Update a returned requisition (submitter resubmits). */
export async function updateResubmit(
  id: string,
  data: {
    payee_name: string;
    amount: number;
    entity: string;
    account_id: string | null;
    payment_method: string;
    description: string;
    vendor_id?: string | null;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('requisitions')
    .update({
      ...data,
      status: 'submitted',
      returned_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

/** Get requisitions for CSV export with filters. */
export async function getForExport(filters: {
  fromDate?: string;
  toDate?: string;
  entity?: string;
  status?: string;
}) {
  const supabase = await createClient();
  let q = supabase
    .from('requisitions')
    .select(`
      *,
      account:accounts(id, name, code, category),
      submitter:profiles!requisitions_submitted_by_fkey(id, full_name)
    `)
    .order('submitted_at', { ascending: true });

  if (filters.fromDate) {
    q = q.gte('submitted_at', filters.fromDate);
  }
  if (filters.toDate) {
    q = q.lte('submitted_at', filters.toDate + 'T23:59:59.999Z');
  }
  if (filters.entity) {
    q = q.eq('entity', filters.entity);
  }
  if (filters.status) {
    q = q.eq('status', filters.status);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data;
}
