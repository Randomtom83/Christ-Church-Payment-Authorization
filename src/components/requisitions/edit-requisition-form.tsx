'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SelectOption } from '@/components/shared/searchable-select';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { resubmitRequisition } from '@/lib/actions/resubmit';
import type { RequisitionWithDetails } from '@/lib/db/requisitions';
import type { Account } from '@/lib/db/accounts';

type Props = {
  requisition: RequisitionWithDetails;
  accounts: Account[];
};

export function EditRequisitionForm({ requisition, accounts }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [entity, setEntity] = useState(requisition.entity);
  const [payeeName, setPayeeName] = useState(requisition.payee_name);
  const [amount, setAmount] = useState(requisition.amount);
  const [accountId, setAccountId] = useState(requisition.account_id ?? '');
  const [paymentMethod, setPaymentMethod] = useState(requisition.payment_method);
  const [description, setDescription] = useState(requisition.description);

  const filteredAccounts = accounts.filter(
    (a) => a.entity === entity && a.account_type === 'expense'
  );

  const accountOptions: SelectOption[] = filteredAccounts.map((a) => ({
    value: a.id,
    label: a.name,
    group: a.category,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set('entity', entity);
    formData.set('payee_name', payeeName);
    formData.set('amount', amount);
    if (accountId) formData.set('account_id', accountId);
    formData.set('payment_method', paymentMethod);
    formData.set('description', description);

    const result = await resubmitRequisition(requisition.id, formData);

    if (result.success) {
      router.push(`/requisitions/${requisition.id}?success=true`);
    } else {
      setFormError(result.error ?? 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Return reason banner */}
      {requisition.returned_reason && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
          <p className="text-base font-semibold text-orange-800">Reason for return:</p>
          <p className="text-lg text-orange-700 mt-1">{requisition.returned_reason}</p>
        </div>
      )}

      {formError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4" role="alert">
          <p className="text-lg text-red-800">{formError}</p>
        </div>
      )}

      {/* Entity */}
      <fieldset className="space-y-2">
        <legend className="text-base font-medium">Entity</legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'church', label: 'Christ Church' },
            { value: 'nscc', label: 'Nursery School' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center justify-center h-14 rounded-lg border-2 cursor-pointer text-lg font-semibold transition-colors ${
                entity === opt.value
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="entity"
                value={opt.value}
                checked={entity === opt.value}
                onChange={(e) => setEntity(e.target.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Payee */}
      <div className="space-y-2">
        <Label htmlFor="payee_name" className="text-base font-medium">Payee Name</Label>
        <Input
          id="payee_name"
          type="text"
          className="h-12 text-lg"
          value={payeeName}
          onChange={(e) => setPayeeName(e.target.value)}
        />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-base font-medium">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-500">$</span>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            className="h-12 text-lg pl-8"
            value={amount}
            onChange={(e) => {
              let val = e.target.value.replace(/[^0-9.]/g, '');
              const parts = val.split('.');
              if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
              setAmount(val);
            }}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Account */}
      {entity && (
        <>
          <SearchableSelect
            id="edit-account"
            label="Account"
            options={accountOptions}
            value={accountId}
            onChange={(val) => setAccountId(val)}
            placeholder="Search accounts..."
            groupBy
          />
          <p className="text-sm text-gray-500 -mt-4">
            Not sure? Leave blank — the treasurer can assign it.
          </p>
        </>
      )}

      {/* Payment method */}
      <fieldset className="space-y-2">
        <legend className="text-base font-medium">Payment Method</legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'check', label: 'Check' },
            { value: 'online', label: 'Online Payment' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center justify-center h-14 rounded-lg border-2 cursor-pointer text-lg font-semibold transition-colors ${
                paymentMethod === opt.value
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={opt.value}
                checked={paymentMethod === opt.value}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">Description / Purpose</Label>
        <textarea
          id="description"
          className="w-full h-28 rounded-lg border border-gray-200 px-4 py-3 text-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this payment for?"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-lg font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner className="mr-2 h-5 w-5" />
            Resubmitting...
          </>
        ) : (
          'Resubmit Requisition'
        )}
      </Button>
    </form>
  );
}
