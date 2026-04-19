import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type Account = {
  id: string;
  code: string;
  legacy_code: string | null;
  name: string;
  entity: string;
  category: string;
  account_type: string;
  is_active: boolean;
  display_order: number | null;
};

/** Get active accounts for an entity, ordered by display_order. */
export async function getByEntity(entity: 'church' | 'nscc') {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('entity', entity)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as Account[];
}

/** Get active expense accounts for an entity (what requisitions code to). */
export async function getExpensesByEntity(entity: 'church' | 'nscc') {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('entity', entity)
    .eq('account_type', 'expense')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as Account[];
}

/** Get all active accounts. */
export async function getAll() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as Account[];
}

/** Get a single account by ID. */
export async function getById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Account;
}
