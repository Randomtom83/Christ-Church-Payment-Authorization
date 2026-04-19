'use server';

import { getCurrentUser } from '@/lib/auth';
import { getForExport } from '@/lib/db/requisitions';
import { getByRequisition } from '@/lib/db/approvals';
import { formatDate } from '@/lib/utils/dates';

/** Generate CSV content for requisitions export. */
export async function generateRequisitionsCSV(filters: {
  fromDate?: string;
  toDate?: string;
  entity?: string;
  status?: string;
}): Promise<{ success: boolean; csv?: string; error?: string }> {
  const auth = await getCurrentUser();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const roles = auth.profile.role as string[];
  if (!roles.includes('treasurer') && !roles.includes('admin')) {
    return { success: false, error: 'Export is only available to treasurer and admin roles' };
  }

  try {
    const requisitions = await getForExport(filters);

    // Build CSV header
    const headers = [
      'Date Submitted',
      'Date Paid',
      'Req Number',
      'Payee Name',
      'Description',
      'Amount',
      'Account Code',
      'Account Name',
      'Category',
      'Entity',
      'Payment Method',
      'Check Number',
      'Status',
      'Submitted By',
      'Approved By',
    ];

    const rows: string[][] = [];

    for (const req of requisitions) {
      // Get approvals for this requisition
      let approvedBy = '';
      try {
        const approvals = await getByRequisition(req.id);
        const approverNames = approvals
          .filter((a) => a.action === 'approved')
          .map((a) => {
            const signer = a.signer;
            if (Array.isArray(signer)) return signer[0]?.full_name ?? 'Unknown';
            return signer?.full_name ?? 'Unknown';
          });
        approvedBy = approverNames.join(', ');
      } catch {
        // Skip if approvals can't be fetched
      }

      const account = Array.isArray(req.account) ? req.account[0] : req.account;
      const submitter = Array.isArray(req.submitter) ? req.submitter[0] : req.submitter;

      rows.push([
        req.submitted_at ? formatDate(req.submitted_at) : '',
        req.payment_date ? formatDate(req.payment_date) : '',
        String(req.req_number),
        req.payee_name,
        req.description,
        req.amount,
        account?.code ?? '',
        account?.name ?? '',
        account?.category ?? '',
        req.entity === 'church' ? 'Christ Church' : 'NSCC',
        req.payment_method === 'check' ? 'Check' : 'Online',
        req.check_number ?? '',
        req.status,
        submitter?.full_name ?? '',
        approvedBy,
      ]);
    }

    // Escape CSV values
    const escapeCsv = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ];

    return { success: true, csv: csvLines.join('\n') };
  } catch (err) {
    console.error('CSV export failed:', err);
    return { success: false, error: 'Failed to generate export.' };
  }
}
