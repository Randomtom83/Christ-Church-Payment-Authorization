import { z } from 'zod';

/** Schema for creating a requisition — shared between client form and server action */
export const requisitionSchema = z.object({
  entity: z.enum(['church', 'nscc'], {
    error: 'Select an entity',
  }),
  payee_name: z
    .string()
    .min(1, 'Payee name is required')
    .max(200, 'Payee name is too long'),
  vendor_id: z.string().uuid().nullable().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Amount must be greater than zero' }
    )
    .refine(
      (val) => {
        return /^\d+(\.\d{0,2})?$/.test(val);
      },
      { message: 'Amount can have at most 2 decimal places' }
    ),
  account_id: z.string().optional().or(z.literal('')),
  payment_method: z.enum(['check', 'online'], {
    error: 'Select a payment method',
  }),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description is too long'),
});

export type RequisitionFormData = z.infer<typeof requisitionSchema>;

/** Schema for saving a template — amount is optional (NULL = "varies") */
export const templateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(200, 'Template name is too long'),
  entity: z.enum(['church', 'nscc']),
  payee_name: z.string().min(1, 'Payee name is required'),
  vendor_id: z.string().uuid().nullable().optional(),
  amount: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Amount must be greater than zero if provided' }
    ),
  account_id: z.string().optional().or(z.literal('')),
  payment_method: z.enum(['check', 'online']),
  description: z.string().max(2000).optional(),
});

export type TemplateFormData = z.infer<typeof templateSchema>;
