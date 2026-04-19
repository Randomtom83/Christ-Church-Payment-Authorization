import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type Vendor = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  default_account_id: string | null;
  entity: string | null;
  is_active: boolean;
};

/** Search vendors by name, optionally filtered by entity. */
export async function search(query: string, entity?: 'church' | 'nscc') {
  const supabase = await createClient();
  let q = supabase
    .from('vendors')
    .select('*')
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (entity) {
    // Show vendors for this entity OR shared vendors (entity = null)
    q = q.or(`entity.eq.${entity},entity.is.null`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data as Vendor[];
}

/** Get all active vendors, optionally filtered by entity. */
export async function getAll(entity?: 'church' | 'nscc') {
  const supabase = await createClient();
  let q = supabase
    .from('vendors')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (entity) {
    q = q.or(`entity.eq.${entity},entity.is.null`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data as Vendor[];
}

/** Get a single vendor by ID with its default account. */
export async function getById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vendors')
    .select('*, default_account:accounts(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Vendor & { default_account: { id: string; name: string; category: string } | null };
}
