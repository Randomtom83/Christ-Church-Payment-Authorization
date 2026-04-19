'use server';

import { getCurrentUser } from '@/lib/auth';
import { rejectSchema } from '@/lib/validators/approval';
import * as requisitionsDb from '@/lib/db/requisitions';
import * as approvalsDb from '@/lib/db/approvals';
import { writeAuditLog } from '@/lib/db/audit';
import {
  notifyTreasurerApproved,
  notifySecondApprovalNeeded,
  notifyRejection,
} from '@/lib/actions/notifications';
import { DUAL_APPROVAL_THRESHOLD } from '@/lib/constants';

export type ActionResult = {
  success: boolean;
  error?: string;
};

/** Approve a requisition. Uses atomic Postgres function to prevent race conditions. */
export async function approveRequisition(id: string): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const roles = auth.profile.role as string[];
  if (!roles.includes('signer')) {
    return { success: false, error: 'Only signers can approve requisitions' };
  }

  const requisition = await requisitionsDb.getById(id);
  if (!requisition) return { success: false, error: 'Requisition not found' };

  // Use the atomic Postgres function
  const result = await approvalsDb.processApproval(
    id,
    auth.profile.id,
    'approved'
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Write audit log
  await writeAuditLog({
    userId: auth.profile.id,
    action: 'requisition.approved',
    entityType: 'requisition',
    entityId: id,
    details: {
      req_number: requisition.req_number,
      signer_name: auth.profile.full_name,
      approvals_count: result.approvals_count,
      approvals_required: result.approvals_required,
    },
  });

  // Send notifications based on result
  const reqInfo = {
    id: requisition.id,
    req_number: requisition.req_number,
    payee_name: requisition.payee_name,
    amount: requisition.amount,
    description: requisition.description,
    entity: requisition.entity,
    submitted_by: requisition.submitted_by,
  };

  try {
    if (result.new_status === 'approved') {
      // Fully approved — notify treasurer
      await notifyTreasurerApproved(reqInfo);
    } else if (
      result.approvals_count === 1 &&
      result.approvals_required === 2
    ) {
      // First of two approvals — notify remaining signers
      await notifySecondApprovalNeeded(reqInfo, auth.profile.full_name);
    }
  } catch {
    // Email failure doesn't block workflow
  }

  return { success: true };
}

/** Reject a requisition with a required reason. */
export async function rejectRequisition(id: string, formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const roles = auth.profile.role as string[];
  if (!roles.includes('signer')) {
    return { success: false, error: 'Only signers can reject requisitions' };
  }

  const raw = { reason: formData.get('reason') as string };
  const parsed = rejectSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const requisition = await requisitionsDb.getById(id);
  if (!requisition) return { success: false, error: 'Requisition not found' };

  // Use the atomic Postgres function
  const result = await approvalsDb.processApproval(
    id,
    auth.profile.id,
    'rejected',
    parsed.data.reason
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Write audit log
  await writeAuditLog({
    userId: auth.profile.id,
    action: 'requisition.rejected',
    entityType: 'requisition',
    entityId: id,
    details: {
      req_number: requisition.req_number,
      signer_name: auth.profile.full_name,
      reason: parsed.data.reason,
    },
  });

  // Notify treasurer and submitter
  try {
    await notifyRejection(
      {
        id: requisition.id,
        req_number: requisition.req_number,
        payee_name: requisition.payee_name,
        amount: requisition.amount,
        description: requisition.description,
        entity: requisition.entity,
        submitted_by: requisition.submitted_by,
      },
      parsed.data.reason,
      auth.profile.full_name
    );
  } catch {
    // Email failure doesn't block workflow
  }

  return { success: true };
}
