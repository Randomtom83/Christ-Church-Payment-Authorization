'use server';

import { getSigners, getTreasurers, getProfile } from '@/lib/db/profiles';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://christ-church-payment-authorization.vercel.app';

type RequisitionInfo = {
  id: string;
  req_number: number;
  payee_name: string;
  amount: string;
  description: string;
  entity: string;
  submitted_by: string;
};

/** Send an email. Falls back to console.log if Resend is not configured. */
async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL STUB] Body: ${body.substring(0, 200)}...`);
    return;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'ChurchOps <notifications@christchurchbg.org>',
      to,
      subject,
      text: body,
    });
  } catch (err) {
    // Never block workflow on email failure
    console.error('Email send failed:', err);
  }
}

/** Format dollar amount for email subject/body. */
function fmtAmount(amount: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

/** Notify treasurer(s) that a new requisition was submitted. */
export async function notifyTreasurerNewSubmission(req: RequisitionInfo): Promise<void> {
  const treasurers = await getTreasurers();
  const submitter = await getProfile(req.submitted_by);
  const submitterName = submitter?.full_name ?? 'Unknown';
  const link = `${APP_URL}/requisitions/${req.id}`;

  for (const t of treasurers) {
    if (!t.email) continue;
    await sendEmail(
      t.email,
      `New Requisition: ${req.payee_name} — ${fmtAmount(req.amount)}`,
      `A new requisition has been submitted and needs your review.\n\n` +
      `Submitted by: ${submitterName}\n` +
      `Payee: ${req.payee_name}\n` +
      `Amount: ${fmtAmount(req.amount)}\n` +
      `Description: ${req.description}\n\n` +
      `Review it here: ${link}`
    );
  }
}

/** Notify all active signers that a requisition needs approval. */
export async function notifySignersForApproval(
  req: RequisitionInfo,
  preparedByName: string
): Promise<void> {
  const signers = await getSigners();
  const link = `${APP_URL}/requisitions/${req.id}`;

  for (const s of signers) {
    if (!s.email) continue;
    await sendEmail(
      s.email,
      `Approval Needed: ${req.payee_name} — ${fmtAmount(req.amount)}`,
      `A requisition has been prepared and needs your approval.\n\n` +
      `Payee: ${req.payee_name}\n` +
      `Amount: ${fmtAmount(req.amount)}\n` +
      `Description: ${req.description}\n` +
      `Prepared by: ${preparedByName}\n\n` +
      `Review and approve here: ${link}`
    );
  }
}

/** Notify the submitter that their requisition was returned. */
export async function notifySubmitterReturned(
  req: RequisitionInfo,
  reason: string
): Promise<void> {
  const submitter = await getProfile(req.submitted_by);
  if (!submitter?.email) return;

  const link = `${APP_URL}/requisitions/${req.id}`;

  await sendEmail(
    submitter.email,
    `Requisition Returned: ${req.payee_name} — ${fmtAmount(req.amount)}`,
    `Your requisition has been returned and needs your attention.\n\n` +
    `Payee: ${req.payee_name}\n` +
    `Amount: ${fmtAmount(req.amount)}\n\n` +
    `Reason: ${reason}\n\n` +
    `View and edit here: ${link}`
  );
}

/** Notify treasurer(s) that a requisition has been fully approved. */
export async function notifyTreasurerApproved(req: RequisitionInfo): Promise<void> {
  const treasurers = await getTreasurers();
  const link = `${APP_URL}/requisitions/${req.id}`;

  for (const t of treasurers) {
    if (!t.email) continue;
    await sendEmail(
      t.email,
      `Ready to Send: ${req.payee_name} — ${fmtAmount(req.amount)}`,
      `A requisition has been fully approved and is ready for payment.\n\n` +
      `Payee: ${req.payee_name}\n` +
      `Amount: ${fmtAmount(req.amount)}\n\n` +
      `View it here: ${link}`
    );
  }
}

/** Notify remaining signers that a second approval is needed (dual-approval items). */
export async function notifySecondApprovalNeeded(
  req: RequisitionInfo,
  firstSignerName: string
): Promise<void> {
  const signers = await getSigners();
  const link = `${APP_URL}/requisitions/${req.id}`;

  for (const s of signers) {
    if (!s.email) continue;
    await sendEmail(
      s.email,
      `Second Approval Needed: ${req.payee_name} — ${fmtAmount(req.amount)}`,
      `A requisition needs a second signature.\n\n` +
      `Payee: ${req.payee_name}\n` +
      `Amount: ${fmtAmount(req.amount)}\n` +
      `Description: ${req.description}\n` +
      `First approved by: ${firstSignerName}\n\n` +
      `Review and approve here: ${link}`
    );
  }
}

/** Notify treasurer + submitter that a requisition was rejected. */
export async function notifyRejection(
  req: RequisitionInfo,
  reason: string,
  rejectorName: string
): Promise<void> {
  const treasurers = await getTreasurers();
  const submitter = await getProfile(req.submitted_by);
  const link = `${APP_URL}/requisitions/${req.id}`;

  // Notify treasurer
  for (const t of treasurers) {
    if (!t.email) continue;
    await sendEmail(
      t.email,
      `Requisition Rejected: ${req.payee_name} — ${fmtAmount(req.amount)}`,
      `A requisition has been rejected by ${rejectorName}.\n\n` +
      `Payee: ${req.payee_name}\n` +
      `Amount: ${fmtAmount(req.amount)}\n` +
      `Reason: ${reason}\n\n` +
      `View it here: ${link}`
    );
  }

  // Notify submitter
  if (submitter?.email) {
    await sendEmail(
      submitter.email,
      `Requisition Rejected: ${req.payee_name} — ${fmtAmount(req.amount)}`,
      `Your requisition has been rejected.\n\n` +
      `Payee: ${req.payee_name}\n` +
      `Amount: ${fmtAmount(req.amount)}\n` +
      `Rejected by: ${rejectorName}\n` +
      `Reason: ${reason}\n\n` +
      `View it here: ${link}`
    );
  }
}
