'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { requisitionSchema } from '@/lib/validators/requisition';
import * as requisitionsDb from '@/lib/db/requisitions';
import * as attachmentsDb from '@/lib/db/attachments';
import { writeAuditLog } from '@/lib/db/audit';
import { createAdminClient } from '@/lib/supabase/server';

export type ActionResult = {
  success: boolean;
  error?: string;
  requisitionId?: string;
};

/** Create a new requisition with optional file attachments. */
export async function createRequisition(formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  // Extract form fields
  const raw = {
    entity: formData.get('entity') as string,
    payee_name: formData.get('payee_name') as string,
    vendor_id: formData.get('vendor_id') as string || null,
    amount: formData.get('amount') as string,
    account_id: formData.get('account_id') as string,
    payment_method: formData.get('payment_method') as string,
    description: formData.get('description') as string,
  };

  // Validate
  const parsed = requisitionSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError.message };
  }

  try {
    // Create the requisition — amount stored as DECIMAL in DB
    const amount = parseFloat(parsed.data.amount);
    const requisition = await requisitionsDb.create({
      submitted_by: auth.profile.id,
      payee_name: parsed.data.payee_name,
      vendor_id: parsed.data.vendor_id || null,
      amount,
      entity: parsed.data.entity,
      account_id: parsed.data.account_id,
      payment_method: parsed.data.payment_method,
      description: parsed.data.description,
    });

    // Upload attachments
    const files = formData.getAll('files') as File[];
    if (files.length > 0) {
      const admin = createAdminClient();
      for (const file of files) {
        if (!(file instanceof File) || file.size === 0) continue;

        const filePath = `requisitions/${requisition.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await admin.storage
          .from('attachments')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('File upload failed:', uploadError.message);
          continue; // Don't fail the whole requisition for a file upload issue
        }

        // Determine file type based on content
        const fileType = file.type === 'application/pdf' ? 'invoice' : 'receipt';

        await attachmentsDb.create({
          requisition_id: requisition.id,
          file_path: filePath,
          file_name: file.name,
          file_type: fileType,
          file_size: file.size,
          uploaded_by: auth.profile.id,
        });
      }
    }

    // Handle template save
    const saveAsTemplate = formData.get('save_as_template') === 'true';
    if (saveAsTemplate) {
      const templateName = formData.get('template_name') as string;
      if (templateName) {
        const { createTemplate } = await import('@/lib/actions/templates');
        const templateForm = new FormData();
        templateForm.set('name', templateName);
        templateForm.set('entity', parsed.data.entity);
        templateForm.set('payee_name', parsed.data.payee_name);
        if (parsed.data.vendor_id) templateForm.set('vendor_id', parsed.data.vendor_id);
        templateForm.set('amount', parsed.data.amount);
        templateForm.set('account_id', parsed.data.account_id);
        templateForm.set('payment_method', parsed.data.payment_method);
        templateForm.set('description', parsed.data.description);
        await createTemplate(templateForm);
      }
    }

    // Audit log
    await writeAuditLog({
      userId: auth.profile.id,
      action: 'requisition.submitted',
      entityType: 'requisition',
      entityId: requisition.id,
      details: {
        req_number: requisition.req_number,
        payee_name: parsed.data.payee_name,
        amount,
        entity: parsed.data.entity,
      },
    });

    return { success: true, requisitionId: requisition.id };
  } catch (err) {
    console.error('Create requisition failed:', err);
    return { success: false, error: 'Failed to create requisition. Please try again.' };
  }
}

/** Cancel a requisition (submitter only, status must be "submitted"). */
export async function cancelRequisition(id: string): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  // Verify the requisition exists and belongs to the user
  const requisition = await requisitionsDb.getById(id);
  if (!requisition) {
    return { success: false, error: 'Requisition not found' };
  }
  if (requisition.submitted_by !== auth.profile.id) {
    return { success: false, error: 'You can only cancel your own requisitions' };
  }
  if (requisition.status !== 'submitted') {
    return { success: false, error: 'Only submitted requisitions can be cancelled' };
  }

  try {
    await requisitionsDb.updateStatus(id, 'cancelled');

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'requisition.cancelled',
      entityType: 'requisition',
      entityId: id,
      details: {
        req_number: requisition.req_number,
        payee_name: requisition.payee_name,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('Cancel requisition failed:', err);
    return { success: false, error: 'Failed to cancel requisition. Please try again.' };
  }
}
