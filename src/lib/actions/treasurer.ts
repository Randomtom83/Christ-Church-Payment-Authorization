'use server';

import { getCurrentUser } from '@/lib/auth';
import { prepareSchema, returnSchema, markPaidSchema } from '@/lib/validators/treasurer';
import * as requisitionsDb from '@/lib/db/requisitions';
import { writeAuditLog } from '@/lib/db/audit';
import { notifySignersForApproval, notifySubmitterReturned } from '@/lib/actions/notifications';
import { DUAL_APPROVAL_THRESHOLD } from '@/lib/constants';

export type ActionResult = {
  success: boolean;
  error?: string;
};

/** Prepare a requisition and route it for signer approval. Treasurer only. */
export async function prepareRequisition(id: string, formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const roles = auth.profile.role as string[];
  if (!roles.includes('treasurer') && !roles.includes('admin')) {
    return { success: false, error: 'Only the treasurer can prepare requisitions' };
  }

  const requisition = await requisitionsDb.getById(id);
  if (!requisition) return { success: false, error: 'Requisition not found' };
  if (requisition.status !== 'submitted') {
    return { success: false, error: 'Only submitted requisitions can be prepared' };
  }

  const raw = {
    account_id: formData.get('account_id') as string,
    check_number: formData.get('check_number') as string || undefined,
    prepared_notes: formData.get('prepared_notes') as string || undefined,
  };

  const parsed = prepareSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await requisitionsDb.updatePrepare(id, {
      account_id: parsed.data.account_id,
      check_number: parsed.data.check_number ?? null,
      prepared_notes: parsed.data.prepared_notes ?? null,
      prepared_by: auth.profile.id,
    });

    const amount = parseFloat(requisition.amount);
    const approvalType = amount >= DUAL_APPROVAL_THRESHOLD ? 'dual' : 'single';

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'requisition.prepared',
      entityType: 'requisition',
      entityId: id,
      details: {
        req_number: requisition.req_number,
        approval_type: approvalType,
        amount,
      },
    });

    // Notify signers
    try {
      await notifySignersForApproval(
        {
          id: requisition.id,
          req_number: requisition.req_number,
          payee_name: requisition.payee_name,
          amount: requisition.amount,
          description: requisition.description,
          entity: requisition.entity,
          submitted_by: requisition.submitted_by,
        },
        auth.profile.full_name
      );
    } catch {
      // Email failure doesn't block workflow
    }

    return { success: true };
  } catch (err) {
    console.error('Prepare requisition failed:', err);
    return { success: false, error: 'Failed to prepare requisition.' };
  }
}

/** Return a requisition to the submitter for corrections. Treasurer only. */
export async function returnRequisition(id: string, formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const roles = auth.profile.role as string[];
  if (!roles.includes('treasurer') && !roles.includes('admin')) {
    return { success: false, error: 'Only the treasurer can return requisitions' };
  }

  const requisition = await requisitionsDb.getById(id);
  if (!requisition) return { success: false, error: 'Requisition not found' };
  if (requisition.status !== 'submitted') {
    return { success: false, error: 'Only submitted requisitions can be returned' };
  }

  const raw = { reason: formData.get('reason') as string };
  const parsed = returnSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await requisitionsDb.updateReturn(id, parsed.data.reason);

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'requisition.returned',
      entityType: 'requisition',
      entityId: id,
      details: {
        req_number: requisition.req_number,
        reason: parsed.data.reason,
      },
    });

    // Notify submitter
    try {
      await notifySubmitterReturned(
        {
          id: requisition.id,
          req_number: requisition.req_number,
          payee_name: requisition.payee_name,
          amount: requisition.amount,
          description: requisition.description,
          entity: requisition.entity,
          submitted_by: requisition.submitted_by,
        },
        parsed.data.reason
      );
    } catch {
      // Email failure doesn't block workflow
    }

    return { success: true };
  } catch (err) {
    console.error('Return requisition failed:', err);
    return { success: false, error: 'Failed to return requisition.' };
  }
}

/** Mark an approved requisition as paid. Treasurer only. */
export async function markAsPaid(id: string, formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const roles = auth.profile.role as string[];
  if (!roles.includes('treasurer') && !roles.includes('admin')) {
    return { success: false, error: 'Only the treasurer can mark requisitions as paid' };
  }

  const requisition = await requisitionsDb.getById(id);
  if (!requisition) return { success: false, error: 'Requisition not found' };
  if (requisition.status !== 'approved') {
    return { success: false, error: 'Only approved requisitions can be marked as paid' };
  }

  const raw = {
    payment_date: formData.get('payment_date') as string,
    payment_reference: formData.get('payment_reference') as string || undefined,
  };

  const parsed = markPaidSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await requisitionsDb.updatePaid(id, {
      payment_date: parsed.data.payment_date,
      payment_reference: parsed.data.payment_reference ?? null,
      paid_by: auth.profile.id,
    });

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'requisition.paid',
      entityType: 'requisition',
      entityId: id,
      details: {
        req_number: requisition.req_number,
        payment_date: parsed.data.payment_date,
        amount: requisition.amount,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('Mark as paid failed:', err);
    return { success: false, error: 'Failed to mark as paid.' };
  }
}
