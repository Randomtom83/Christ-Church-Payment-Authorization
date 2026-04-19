'use server';

import { getCurrentUser } from '@/lib/auth';
import * as depositItemsDb from '@/lib/db/deposit-items';
import * as depositsDb from '@/lib/db/deposits';
import { writeAuditLog } from '@/lib/db/audit';
import { createAdminClient } from '@/lib/supabase/server';
import { dollarsToCents, centsToDollars } from '@/lib/utils/currency';

export type ActionResult = {
  success: boolean;
  error?: string;
  itemId?: string;
};

/** Recalculate and update deposit totals after item changes. */
async function recalcTotals(depositId: string) {
  const totals = await depositItemsDb.getTotalsByCategory(depositId);
  await depositsDb.updateTotals(depositId, {
    total_checks: totals.totalChecks,
    total_cash: totals.totalCash,
    total_amount: totals.totalAmount,
  });
}

/** Add a check item to a deposit. */
export async function addCheckItem(depositId: string, formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const amountStr = formData.get('amount') as string;
  if (!amountStr) return { success: false, error: 'Amount is required' };
  const amountCents = dollarsToCents(amountStr);
  const amount = centsToDollars(amountCents);

  const category = formData.get('category') as string;
  if (!category) return { success: false, error: 'Category is required' };

  const isPledge = category === 'pledge';
  const memberName = formData.get('member_name') as string || null;
  const givingNumber = formData.get('giving_number') as string || null;
  const checkNumber = formData.get('check_number') as string || null;

  // Handle check image upload
  let checkImagePath: string | null = null;
  const imageFile = formData.get('check_image') as File | null;
  if (imageFile && imageFile instanceof File && imageFile.size > 0) {
    const admin = createAdminClient();
    const filePath = `deposits/${depositId}/checks/${Date.now()}-${imageFile.name}`;
    const { error: uploadError } = await admin.storage
      .from('attachments')
      .upload(filePath, imageFile, { contentType: imageFile.type, upsert: false });

    if (!uploadError) {
      checkImagePath = filePath;
    } else {
      console.error('Check image upload failed:', uploadError.message);
    }
  }

  try {
    const item = await depositItemsDb.create({
      deposit_id: depositId,
      item_type: 'check',
      amount,
      is_pledge_payment: isPledge,
      member_name: memberName,
      giving_number: givingNumber,
      check_number: checkNumber,
      check_image_path: checkImagePath,
      category_label: formData.get('category_label') as string || category,
    });

    await recalcTotals(depositId);

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'deposit_item.check_added',
      entityType: 'deposit',
      entityId: depositId,
      details: { item_id: item.id, amount, category },
    });

    return { success: true, itemId: item.id };
  } catch (err) {
    console.error('Add check item failed:', err);
    return { success: false, error: 'Failed to add check.' };
  }
}

/** Add a cash item to a deposit. */
export async function addCashItem(depositId: string, formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const totalCents = parseInt(formData.get('total_cents') as string, 10);
  if (!totalCents || totalCents <= 0) {
    return { success: false, error: 'Cash total must be greater than zero' };
  }

  const amount = centsToDollars(totalCents);
  const category = formData.get('category') as string || 'plate';
  const denomStr = formData.get('denomination_counts') as string;
  const denominationCounts = denomStr ? JSON.parse(denomStr) : null;

  try {
    const item = await depositItemsDb.create({
      deposit_id: depositId,
      item_type: 'cash',
      amount,
      denomination_counts: denominationCounts,
      category_label: formData.get('category_label') as string || category,
    });

    await recalcTotals(depositId);

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'deposit_item.cash_added',
      entityType: 'deposit',
      entityId: depositId,
      details: { item_id: item.id, amount, category },
    });

    return { success: true, itemId: item.id };
  } catch (err) {
    console.error('Add cash item failed:', err);
    return { success: false, error: 'Failed to add cash entry.' };
  }
}

/** Add a special/designated item to a deposit. */
export async function addSpecialItem(depositId: string, formData: FormData): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const amountStr = formData.get('amount') as string;
  if (!amountStr) return { success: false, error: 'Amount is required' };
  const amount = centsToDollars(dollarsToCents(amountStr));

  const description = formData.get('description') as string;
  if (!description) return { success: false, error: 'Description is required' };

  const category = formData.get('category') as string || 'other';

  try {
    const item = await depositItemsDb.create({
      deposit_id: depositId,
      item_type: 'special',
      amount,
      category_label: formData.get('category_label') as string || category,
      notes: description,
    });

    await recalcTotals(depositId);

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'deposit_item.special_added',
      entityType: 'deposit',
      entityId: depositId,
      details: { item_id: item.id, amount, description },
    });

    return { success: true, itemId: item.id };
  } catch (err) {
    console.error('Add special item failed:', err);
    return { success: false, error: 'Failed to add special item.' };
  }
}

/** Delete a deposit item. */
export async function deleteItem(depositId: string, itemId: string): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  try {
    await depositItemsDb.remove(itemId);
    await recalcTotals(depositId);

    await writeAuditLog({
      userId: auth.profile.id,
      action: 'deposit_item.deleted',
      entityType: 'deposit',
      entityId: depositId,
      details: { item_id: itemId },
    });

    return { success: true };
  } catch (err) {
    console.error('Delete item failed:', err);
    return { success: false, error: 'Failed to delete item.' };
  }
}
