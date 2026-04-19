import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export type Attachment = {
  id: string;
  requisition_id: string | null;
  deposit_id: string | null;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  uploaded_by: string;
  uploaded_at: string;
};

/** Get all attachments for a requisition. */
export async function getByRequisition(requisitionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('requisition_id', requisitionId)
    .order('uploaded_at', { ascending: true });

  if (error) throw error;
  return data as Attachment[];
}

/** Insert an attachment record. */
export async function create(data: {
  requisition_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  uploaded_by: string;
}) {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('attachments')
    .insert(data)
    .select('id')
    .single();

  if (error) throw error;
  return row as { id: string };
}

/** Delete an attachment record and its storage file. */
export async function remove(id: string) {
  const supabase = await createClient();

  // Get the file path before deleting the record
  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Delete the storage file using admin client (bypasses storage RLS)
  if (attachment?.file_path) {
    const admin = createAdminClient();
    await admin.storage.from('attachments').remove([attachment.file_path]);
  }

  // Delete the record
  const { error } = await supabase.from('attachments').delete().eq('id', id);
  if (error) throw error;
}

/** Get a signed URL for viewing an attachment. */
export async function getSignedUrl(filePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
}
