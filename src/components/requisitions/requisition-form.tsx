'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SelectOption } from '@/components/shared/searchable-select';
import { FileUpload } from '@/components/shared/file-upload';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { createRequisition } from '@/lib/actions/requisitions';
import { requisitionSchema } from '@/lib/validators/requisition';
import type { Account } from '@/lib/db/accounts';
import type { Vendor } from '@/lib/db/vendors';

type RequisitionFormProps = {
  accounts: Account[];
  vendors: Vendor[];
  templateId?: string | null;
  templateData?: {
    entity?: string;
    payee_name?: string;
    vendor_id?: string;
    amount?: string;
    account_id?: string;
    payment_method?: string;
    description?: string;
  } | null;
};

export function RequisitionForm({ accounts, vendors, templateId, templateData }: RequisitionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form state
  const [entity, setEntity] = useState(templateData?.entity ?? '');
  const [payeeName, setPayeeName] = useState(templateData?.payee_name ?? '');
  const [vendorId, setVendorId] = useState(templateData?.vendor_id ?? '');
  const [amount, setAmount] = useState(templateData?.amount ?? '');
  const [accountId, setAccountId] = useState(templateData?.account_id ?? '');
  const [paymentMethod, setPaymentMethod] = useState(templateData?.payment_method ?? '');
  const [description, setDescription] = useState(templateData?.description ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Filter accounts by selected entity (expense accounts only for requisitions)
  const filteredAccounts = accounts.filter(
    (a) => a.entity === entity && a.account_type === 'expense'
  );

  // Group accounts by category for the dropdown
  const accountOptions: SelectOption[] = filteredAccounts.map((a) => ({
    value: a.id,
    label: a.name,
    group: a.category,
  }));

  // Filter vendors by entity
  const filteredVendors = vendors.filter(
    (v) => !entity || !v.entity || v.entity === entity
  );

  const vendorOptions: SelectOption[] = filteredVendors.map((v) => ({
    value: v.id,
    label: v.name,
  }));

  // When entity changes, clear account if it doesn't match
  useEffect(() => {
    if (accountId && entity) {
      const acct = accounts.find((a) => a.id === accountId);
      if (acct && acct.entity !== entity) {
        setAccountId('');
      }
    }
  }, [entity, accountId, accounts]);

  // When vendor selected, auto-fill payee name
  const handleVendorSelect = (value: string, option?: SelectOption) => {
    setVendorId(value);
    if (option) {
      setPayeeName(option.label);
      // Check for default account — only use it if it matches the selected entity
      const vendor = vendors.find((v) => v.id === value);
      if (vendor?.default_account_id) {
        const defaultAccount = accounts.find((a) => a.id === vendor.default_account_id);
        if (defaultAccount && defaultAccount.entity === entity) {
          setAccountId(vendor.default_account_id);
        }
      }
    } else {
      setPayeeName('');
    }
  };

  // Validate a single field on blur
  const validateField = (field: string, value: string) => {
    const testData: Record<string, string> = {
      entity: entity,
      payee_name: payeeName,
      amount: amount,
      account_id: accountId,
      payment_method: paymentMethod,
      description: description,
      [field]: value,
    };

    const result = requisitionSchema.safeParse(testData);
    if (result.success) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    } else {
      const fieldError = result.error.issues.find((e) => String(e.path[0]) === field);
      if (fieldError) {
        setFieldErrors((prev) => ({ ...prev, [field]: fieldError.message }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate all fields
    const data = {
      entity,
      payee_name: payeeName,
      amount,
      account_id: accountId,
      payment_method: paymentMethod,
      description,
    };

    const parsed = requisitionSchema.safeParse(data);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const err of parsed.error.issues) {
        const field = String(err.path[0]);
        if (!errors[field]) errors[field] = err.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.set('entity', entity);
    formData.set('payee_name', payeeName);
    if (vendorId) formData.set('vendor_id', vendorId);
    formData.set('amount', amount);
    formData.set('account_id', accountId);
    formData.set('payment_method', paymentMethod);
    formData.set('description', description);
    if (templateId) formData.set('template_id', templateId);

    // Attach files
    for (const file of files) {
      formData.append('files', file);
    }

    // Template fields
    if (saveAsTemplate && templateName) {
      formData.set('save_as_template', 'true');
      formData.set('template_name', templateName);
    }

    const result = await createRequisition(formData);

    if (result.success && result.requisitionId) {
      router.push(`/requisitions/${result.requisitionId}?success=true`);
    } else {
      setFormError(result.error ?? 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error banner */}
      {formError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4" role="alert">
          <p className="text-lg text-red-800">{formError}</p>
        </div>
      )}

      {/* Entity selector */}
      <fieldset className="space-y-2">
        <legend className="text-base font-medium">Entity (required)</legend>
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
                onChange={(e) => {
                  setEntity(e.target.value);
                  validateField('entity', e.target.value);
                }}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {fieldErrors.entity && (
          <p className="text-sm text-red-700" role="alert">{fieldErrors.entity}</p>
        )}
      </fieldset>

      {/* Vendor search (optional) */}
      {entity && (
        <SearchableSelect
          id="vendor"
          label="Search Existing Vendors"
          options={vendorOptions}
          value={vendorId}
          onChange={handleVendorSelect}
          placeholder="Type vendor name..."
        />
      )}

      {/* Payee name */}
      <div className="space-y-2">
        <Label htmlFor="payee_name" className="text-base font-medium">
          Payee Name (required)
        </Label>
        <Input
          id="payee_name"
          type="text"
          className="h-12 text-lg"
          value={payeeName}
          onChange={(e) => setPayeeName(e.target.value)}
          onBlur={() => validateField('payee_name', payeeName)}
          aria-describedby={fieldErrors.payee_name ? 'payee_name-error' : undefined}
          aria-invalid={!!fieldErrors.payee_name}
        />
        {fieldErrors.payee_name && (
          <p id="payee_name-error" className="text-sm text-red-700" role="alert">
            {fieldErrors.payee_name}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-base font-medium">
          Amount (required)
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-500">$</span>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            className="h-12 text-lg pl-8"
            value={amount}
            onChange={(e) => {
              // Allow only digits and one decimal point
              let val = e.target.value.replace(/[^0-9.]/g, '');
              // Prevent multiple decimal points
              const parts = val.split('.');
              if (parts.length > 2) {
                val = parts[0] + '.' + parts.slice(1).join('');
              }
              setAmount(val);
            }}
            onBlur={() => validateField('amount', amount)}
            placeholder="0.00"
            aria-describedby={fieldErrors.amount ? 'amount-error' : undefined}
            aria-invalid={!!fieldErrors.amount}
          />
        </div>
        {fieldErrors.amount && (
          <p id="amount-error" className="text-sm text-red-700" role="alert">
            {fieldErrors.amount}
          </p>
        )}
      </div>

      {/* Account selector */}
      {entity ? (
        <SearchableSelect
          id="account"
          label="Account"
          options={accountOptions}
          value={accountId}
          onChange={(val) => {
            setAccountId(val);
            if (val) validateField('account_id', val);
          }}
          placeholder="Search accounts..."
          required
          error={fieldErrors.account_id}
          groupBy
        />
      ) : (
        <div className="space-y-2">
          <Label className="text-base font-medium">Account (required)</Label>
          <p className="text-lg text-gray-500 italic">Select an entity first</p>
        </div>
      )}

      {/* Payment method */}
      <fieldset className="space-y-2">
        <legend className="text-base font-medium">Payment Method (required)</legend>
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
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  validateField('payment_method', e.target.value);
                }}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {fieldErrors.payment_method && (
          <p className="text-sm text-red-700" role="alert">{fieldErrors.payment_method}</p>
        )}
      </fieldset>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">
          Description / Purpose (required)
        </Label>
        <textarea
          id="description"
          className="w-full h-28 rounded-lg border border-gray-200 px-4 py-3 text-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => validateField('description', description)}
          placeholder="What is this payment for?"
          aria-describedby={fieldErrors.description ? 'description-error' : undefined}
          aria-invalid={!!fieldErrors.description}
        />
        {fieldErrors.description && (
          <p id="description-error" className="text-sm text-red-700" role="alert">
            {fieldErrors.description}
          </p>
        )}
      </div>

      {/* File upload */}
      <FileUpload files={files} onChange={setFiles} />

      {/* Save as template toggle */}
      <div className="space-y-3 border-t border-gray-200 pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={saveAsTemplate}
            onChange={(e) => setSaveAsTemplate(e.target.checked)}
            className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-lg">Save as reusable template</span>
        </label>

        {saveAsTemplate && (
          <div className="space-y-2">
            <Label htmlFor="template_name" className="text-base font-medium">
              Template Name (required)
            </Label>
            <Input
              id="template_name"
              type="text"
              className="h-12 text-lg"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Jane Smith - Alto Section Leader"
            />
          </div>
        )}
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-lg font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner className="mr-2 h-5 w-5" />
            Submitting...
          </>
        ) : (
          'Submit Requisition'
        )}
      </Button>
    </form>
  );
}
