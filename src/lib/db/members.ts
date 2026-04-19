import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type Member = {
  id: string;
  full_name: string;
  giving_number: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
};

/** Search members by name (partial match, case insensitive). */
export async function search(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('is_active', true)
    .ilike('full_name', `%${query}%`)
    .order('full_name', { ascending: true })
    .limit(20);

  if (error) throw error;
  return data as Member[];
}

/** Get all active members (for client-side caching). */
export async function getAll() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('members')
    .select('id, full_name, giving_number')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data as Pick<Member, 'id' | 'full_name' | 'giving_number'>[];
}

/** Get a member by giving number. */
export async function getByGivingNumber(num: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('giving_number', num)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data as Member | null;
}
