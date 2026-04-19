'use server';

import { getCurrentUser } from '@/lib/auth';
import { templateSchema } from '@/lib/validators/requisition';
import * as templatesDb from '@/lib/db/templates';
import { writeAuditLog } from '@/lib/db/audit';

export type ActionResult = {
  success: boolean;
  error?: string;
  templateId?: string;
};

/** Create a new template. */
export async function createTemplate(formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const raw = {
    name: formData.get('name') as string,
    entity: formData.get('entity') as string,
    payee_name: formData.get('payee_name') as string,
    vendor_id: formData.get('vendor_id') as string || undefined,
    amount: formData.get('amount') as string || undefined,
    account_id: formData.get('account_id') as string,
    payment_method: formData.get('payment_method') as string,
    description: formData.get('description') as string || undefined,
  };

  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const amount = parsed.data.amount ? parseFloat(parsed.data.amount) : null;
    const template = await templatesDb.create({
      created_by: auth.profile.id,
      name: parsed.data.name,
      payee_name: parsed.data.payee_name,
      vendor_id: parsed.data.vendor_id || null,
      amount,
      entity: parsed.data.entity,
      account_id: parsed.data.account_id,
      payment_method: parsed.data.payment_method,
      description: parsed.data.description || null,
    });

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'template.created',
      entityType: 'template',
      entityId: template.id,
      details: { name: parsed.data.name },
    });

    return { success: true, templateId: template.id };
  } catch (err) {
    console.error('Create template failed:', err);
    return { success: false, error: 'Failed to create template.' };
  }
}

/** Update an existing template. */
export async function updateTemplate(id: string, formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const existing = await templatesDb.getById(id);
  if (!existing) return { success: false, error: 'Template not found' };
  if (existing.created_by !== auth.profile.id) {
    return { success: false, error: 'You can only edit your own templates' };
  }

  const raw = {
    name: formData.get('name') as string,
    entity: formData.get('entity') as string,
    payee_name: formData.get('payee_name') as string,
    vendor_id: formData.get('vendor_id') as string || undefined,
    amount: formData.get('amount') as string || undefined,
    account_id: formData.get('account_id') as string,
    payment_method: formData.get('payment_method') as string,
    description: formData.get('description') as string || undefined,
  };

  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const amount = parsed.data.amount ? parseFloat(parsed.data.amount) : null;
    await templatesDb.update(id, {
      name: parsed.data.name,
      payee_name: parsed.data.payee_name,
      vendor_id: parsed.data.vendor_id || null,
      amount,
      entity: parsed.data.entity,
      account_id: parsed.data.account_id,
      payment_method: parsed.data.payment_method,
      description: parsed.data.description || null,
    });

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'template.updated',
      entityType: 'template',
      entityId: id,
      details: { name: parsed.data.name },
    });

    return { success: true, templateId: id };
  } catch (err) {
    console.error('Update template failed:', err);
    return { success: false, error: 'Failed to update template.' };
  }
}

/** Delete (soft) a template. */
export async function deleteTemplate(id: string): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const existing = await templatesDb.getById(id);
  if (!existing) return { success: false, error: 'Template not found' };
  if (existing.created_by !== auth.profile.id) {
    return { success: false, error: 'You can only delete your own templates' };
  }

  try {
    await templatesDb.remove(id);

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'template.deleted',
      entityType: 'template',
      entityId: id,
      details: { name: existing.name },
    });

    return { success: true };
  } catch (err) {
    console.error('Delete template failed:', err);
    return { success: false, error: 'Failed to delete template.' };
  }
}
