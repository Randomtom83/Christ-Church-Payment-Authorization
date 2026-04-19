'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import * as depositsDb from '@/lib/db/deposits';
import * as depositItemsDb from '@/lib/db/deposit-items';
import { writeAuditLog } from '@/lib/db/audit';

export type ActionResult = {
  success: boolean;
  error?: string;
  depositId?: string;
};

/** Create a new deposit or resume today's in-progress one. */
export async function createOrResumeDeposit(): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const roles = auth.profile.role as string[];
  if (!roles.includes('counter') && !roles.includes('admin')) {
    return { success: false, error: 'Only counters can create deposits' };
  }

  // Check for existing in-progress deposit today
  const existing = await depositsDb.getTodayInProgress(auth.profile.id);
  if (existing) {
    return { success: true, depositId: existing.id };
  }

  try {
    const deposit = await depositsDb.create(auth.profile.id);

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'deposit.created',
      entityType: 'deposit',
      entityId: deposit.id,
    });

    return { success: true, depositId: deposit.id };
  } catch (err) {
    console.error('Create deposit failed:', err);
    return { success: false, error: 'Failed to create deposit session.' };
  }
}

/** Submit deposit for Counter 2 verification. */
export async function submitForVerification(id: string): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const deposit = await depositsDb.getById(id);
  if (!deposit) return { success: false, error: 'Deposit not found' };
  if (deposit.counter_1_id !== auth.profile.id) {
    return { success: false, error: 'Only the primary counter can submit for verification' };
  }
  if (deposit.status !== 'in_progress') {
    return { success: false, error: 'Deposit is not in progress' };
  }

  // Recalculate totals from items
  const totals = await depositItemsDb.getTotalsByCategory(id);
  await depositsDb.updateTotals(id, {
    total_checks: totals.totalChecks,
    total_cash: totals.totalCash,
    total_amount: totals.totalAmount,
  });

  await depositsDb.updateStatus(id, 'pending_verification');

  await writeAuditLog({
    userId: auth.profile.id,
    action: 'deposit.submitted_for_verification',
    entityType: 'deposit',
    entityId: id,
    details: { total_amount: totals.totalAmount },
  });

  return { success: true };
}

/** Counter 2 verifies the deposit. */
export async function verifyDeposit(id: string): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const roles = auth.profile.role as string[];
  if (!roles.includes('counter') && !roles.includes('admin')) {
    return { success: false, error: 'Only counters can verify deposits' };
  }

  const deposit = await depositsDb.getById(id);
  if (!deposit) return { success: false, error: 'Deposit not found' };
  if (deposit.status !== 'pending_verification') {
    return { success: false, error: 'Deposit is not pending verification' };
  }
  if (deposit.counter_1_id === auth.profile.id) {
    return { success: false, error: 'The same counter cannot verify their own deposit' };
  }

  try {
    await depositsDb.updateVerification(id, auth.profile.id);

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'deposit.verified',
      entityType: 'deposit',
      entityId: id,
      details: { total_amount: deposit.total_amount },
    });

    // Notify treasurer
    try {
      const { notifyTreasurerDepositVerified } = await import('@/lib/actions/notifications');
      await notifyTreasurerDepositVerified({
        id,
        total_amount: deposit.total_amount,
        deposit_date: deposit.deposit_date,
      });
    } catch {
      // Email failure doesn't block workflow
    }

    return { success: true };
  } catch (err) {
    console.error('Verify deposit failed:', err);
    return { success: false, error: 'Failed to verify deposit.' };
  }
}

/** Counter 2 rejects verification — returns to in_progress. */
export async function rejectVerification(id: string, formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const deposit = await depositsDb.getById(id);
  if (!deposit) return { success: false, error: 'Deposit not found' };
  if (deposit.status !== 'pending_verification') {
    return { success: false, error: 'Deposit is not pending verification' };
  }

  const notes = formData.get('notes') as string;
  if (!notes?.trim()) {
    return { success: false, error: 'Please describe what doesn\'t match' };
  }

  try {
    await depositsDb.rejectVerification(id, notes);

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'deposit.verification_rejected',
      entityType: 'deposit',
      entityId: id,
      details: { notes },
    });

    return { success: true };
  } catch (err) {
    console.error('Reject verification failed:', err);
    return { success: false, error: 'Failed to reject verification.' };
  }
}
