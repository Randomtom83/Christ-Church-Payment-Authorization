'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SelectOption } from '@/components/shared/searchable-select';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { prepareRequisition, returnRequisition, markAsPaid } from '@/lib/actions/treasurer';
import { DUAL_APPROVAL_THRESHOLD } from '@/lib/constants';
import type { RequisitionWithDetails } from '@/lib/db/requisitions';
import type { Account } from '@/lib/db/accounts';

type Props = {
  requisition: RequisitionWithDetails;
  accounts: Account[];
};

export function TreasurerActions({ requisition, accounts }: Props) {
  const router = useRouter();

  if (requisition.status === 'submitted') {
    return <PreparePanel requisition={requisition} accounts={accounts} />;
  }

  if (requisition.status === 'approved') {
    return <MarkPaidPanel requisition={requisition} />;
  }

  return null;
}

function PreparePanel({ requisition, accounts }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accountId, setAccountId] = useState(requisition.account_id ?? '');
  const [checkNumber, setCheckNumber] = useState(requisition.check_number ?? '');
  const [notes, setNotes] = useState('');
  const [returnReason, setReturnReason] = useState('');

  const filteredAccounts = accounts.filter(
    (a) => a.entity === requisition.entity && a.account_type === 'expense'
  );

  const accountOptions: SelectOption[] = filteredAccounts.map((a) => ({
    value: a.id,
    label: a.name,
    group: a.category,
  }));

  const amount = parseFloat(requisition.amount);
  const needsDualApproval = amount >= DUAL_APPROVAL_THRESHOLD;

  const handlePrepare = async () => {
    if (!accountId) {
      setError('Account must be assigned before routing for approval');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set('account_id', accountId);
    if (checkNumber) formData.set('check_number', checkNumber);
    if (notes) formData.set('prepared_notes', notes);

    const result = await prepareRequisition(requisition.id, formData);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Failed to prepare');
      setIsSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) {
      setError('Please provide a reason for returning');
      return;
    }
    setError(null);
    setIsReturning(true);

    const formData = new FormData();
    formData.set('reason', returnReason);

    const result = await returnRequisition(requisition.id, formData);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Failed to return');
      setIsReturning(false);
    }
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-xl text-blue-900">Treasurer Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
            <p className="text-base text-red-800">{error}</p>
          </div>
        )}

        {/* Account assignment */}
        <SearchableSelect
          id="treasurer-account"
          label={requisition.account_id ? 'Account (edit if needed)' : 'Assign Account'}
          options={accountOptions}
          value={accountId}
          onChange={(val) => setAccountId(val)}
          placeholder="Search accounts..."
          groupBy
        />

        {/* Check number (only for check payments) */}
        {requisition.payment_method === 'check' && (
          <div className="space-y-2">
            <Label htmlFor="check_number" className="text-base font-medium">
              Check Number
            </Label>
            <Input
              id="check_number"
              type="text"
              className="h-12 text-lg"
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
              placeholder="Enter check number"
            />
          </div>
        )}

        {/* Internal notes */}
        <div className="space-y-2">
          <Label htmlFor="prepared_notes" className="text-base font-medium">
            Internal Notes
          </Label>
          <textarea
            id="prepared_notes"
            className="w-full h-20 rounded-lg border border-gray-200 px-4 py-3 text-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for signers (optional)"
          />
        </div>

        {/* Approval info */}
        <p className="text-base text-blue-800">
          {needsDualApproval
            ? `This requisition requires 2 signatures (amount is $${amount.toFixed(2)}, threshold is $${DUAL_APPROVAL_THRESHOLD}).`
            : `This requisition requires 1 signature.`
          }
        </p>

        {/* Prepare button */}
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          onClick={handlePrepare}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner className="mr-2 h-5 w-5" />
              Routing...
            </>
          ) : (
            '➤ Prepare & Route for Approval'
          )}
        </Button>

        {/* Return section */}
        {!showReturnForm ? (
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            onClick={() => setShowReturnForm(true)}
          >
            ↩ Return to Submitter
          </Button>
        ) : (
          <div className="space-y-3 border-t border-blue-200 pt-4">
            <Label htmlFor="return_reason" className="text-base font-medium">
              Reason for Return
            </Label>
            <textarea
              id="return_reason"
              className="w-full h-20 rounded-lg border border-gray-200 px-4 py-3 text-lg resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="What needs to be fixed?"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 text-lg font-semibold border-orange-300 text-orange-800 hover:bg-orange-50"
                onClick={handleReturn}
                disabled={isReturning}
              >
                {isReturning ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : (
                  'Confirm Return'
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 text-lg"
                onClick={() => { setShowReturnForm(false); setReturnReason(''); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MarkPaidPanel({ requisition }: { requisition: RequisitionWithDetails }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentReference, setPaymentReference] = useState('');

  const handleMarkPaid = async () => {
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set('payment_date', paymentDate);
    if (paymentReference) formData.set('payment_reference', paymentReference);

    const result = await markAsPaid(requisition.id, formData);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Failed to mark as paid');
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader>
        <CardTitle className="text-xl text-green-900">Mark as Paid</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
            <p className="text-base text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="payment_date" className="text-base font-medium">
            Payment Date
          </Label>
          <Input
            id="payment_date"
            type="date"
            className="h-12 text-lg"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        {requisition.payment_method === 'online' && (
          <div className="space-y-2">
            <Label htmlFor="payment_reference" className="text-base font-medium">
              Confirmation / Reference Number
            </Label>
            <Input
              id="payment_reference"
              type="text"
              className="h-12 text-lg"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Optional"
            />
          </div>
        )}

        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-green-700 hover:bg-green-800"
          onClick={handleMarkPaid}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner className="mr-2 h-5 w-5" />
              Processing...
            </>
          ) : (
            '✓ Mark as Paid'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
