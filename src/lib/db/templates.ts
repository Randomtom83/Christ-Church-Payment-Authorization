import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type Template = {
  id: string;
  created_by: string;
  name: string;
  vendor_id: string | null;
  payee_name: string;
  amount: string | null; // NULL = "varies"
  entity: string;
  account_id: string;
  payment_method: string;
  description: string | null;
  is_active: boolean;
  last_used_at: string | null;
  use_count: number;
  created_at: string;
};

export type TemplateWithAccount = Template & {
  account: { id: string; name: string; category: string } | null;
};

/** Get templates created by a user, ordered by most recently used. */
export async function getByUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('requisition_templates')
    .select('*, account:accounts(id, name, category)')
    .eq('created_by', userId)
    .eq('is_active', true)
    .order('last_used_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data as TemplateWithAccount[];
}

/** Get a single template by ID. */
export async function getById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('requisition_templates')
    .select('*, account:accounts(id, name, category)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as TemplateWithAccount;
}

/** Create a new template. */
export async function create(data: {
  created_by: string;
  name: string;
  payee_name: string;
  vendor_id?: string | null;
  amount?: number | null;
  entity: string;
  account_id: string;
  payment_method: string;
  description?: string | null;
}) {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('requisition_templates')
    .insert(data)
    .select('id')
    .single();

  if (error) throw error;
  return row as { id: string };
}

/** Update a template. */
export async function update(
  id: string,
  data: Partial<{
    name: string;
    payee_name: string;
    vendor_id: string | null;
    amount: number | null;
    entity: string;
    account_id: string;
    payment_method: string;
    description: string | null;
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('requisition_templates')
    .update(data)
    .eq('id', id);

  if (error) throw error;
}

/** Soft-delete a template. */
export async function remove(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('requisition_templates')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

/** Atomically increment use_count and update last_used_at. */
export async function incrementUseCount(id: string) {
  const supabase = await createClient();
  // Atomic increment via raw SQL to avoid race conditions
  const { error } = await supabase.rpc('increment_template_use_count', {
    template_id: id,
  });

  // Fallback if RPC doesn't exist yet — still a single update call
  if (error && error.code === '42883') {
    // Function not found — use direct update (less safe but functional)
    const { data: template } = await supabase
      .from('requisition_templates')
      .select('use_count')
      .eq('id', id)
      .single();

    if (template) {
      await supabase
        .from('requisition_templates')
        .update({
          use_count: template.use_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', id);
    }
  }
}
