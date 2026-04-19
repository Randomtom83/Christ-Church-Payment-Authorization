'use server';

import { getCurrentUser } from '@/lib/auth';
import { requisitionSchema } from '@/lib/validators/requisition';
import * as requisitionsDb from '@/lib/db/requisitions';
import { writeAuditLog } from '@/lib/db/audit';
import { notifyTreasurerNewSubmission } from '@/lib/actions/notifications';
import { dollarsToCents, centsToDollars } from '@/lib/utils/currency';

export type ActionResult = {
  success: boolean;
  error?: string;
};

/** Resubmit a returned requisition with updated fields. */
export async function resubmitRequisition(id: string, formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const requisition = await requisitionsDb.getById(id);
  if (!requisition) return { success: false, error: 'Requisition not found' };
  if (requisition.submitted_by !== auth.profile.id) {
    return { success: false, error: 'You can only edit your own requisitions' };
  }
  if (requisition.status !== 'returned') {
    return { success: false, error: 'Only returned requisitions can be resubmitted' };
  }

  const raw = {
    entity: formData.get('entity') as string,
    payee_name: formData.get('payee_name') as string,
    amount: formData.get('amount') as string,
    account_id: formData.get('account_id') as string || undefined,
    payment_method: formData.get('payment_method') as string,
    description: formData.get('description') as string,
  };

  const parsed = requisitionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const amountCents = dollarsToCents(parsed.data.amount);
    const amount = centsToDollars(amountCents);

    await requisitionsDb.updateResubmit(id, {
      payee_name: parsed.data.payee_name,
      amount,
      entity: parsed.data.entity,
      account_id: parsed.data.account_id || null,
      payment_method: parsed.data.payment_method,
      description: parsed.data.description,
      vendor_id: formData.get('vendor_id') as string || null,
    });

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'requisition.resubmitted',
      entityType: 'requisition',
      entityId: id,
      details: {
        req_number: requisition.req_number,
        payee_name: parsed.data.payee_name,
        amount,
      },
    });

    // Notify treasurer
    try {
      await notifyTreasurerNewSubmission({
        id,
        req_number: requisition.req_number,
        payee_name: parsed.data.payee_name,
        amount: String(amount),
        description: parsed.data.description,
        entity: parsed.data.entity,
        submitted_by: auth.profile.id,
      });
    } catch {
      // Email failure doesn't block workflow
    }

    return { success: true };
  } catch (err) {
    console.error('Resubmit requisition failed:', err);
    return { success: false, error: 'Failed to resubmit requisition.' };
  }
}
