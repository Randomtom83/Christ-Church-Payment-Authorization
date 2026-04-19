import { z } from 'zod';

/** Schema for preparing a requisition and routing for approval. */
export const prepareSchema = z.object({
  account_id: z.string().uuid('Account must be assigned before routing'),
  check_number: z.string().max(50).optional(),
  prepared_notes: z.string().max(2000).optional(),
});

export type PrepareFormData = z.infer<typeof prepareSchema>;

/** Schema for returning a requisition to the submitter. */
export const returnSchema = z.object({
  reason: z
    .string()
    .min(1, 'Please provide a reason for returning this requisition')
    .max(2000),
});

export type ReturnFormData = z.infer<typeof returnSchema>;

/** Schema for marking a requisition as paid. */
export const markPaidSchema = z.object({
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_reference: z.string().max(100).optional(),
});

export type MarkPaidFormData = z.infer<typeof markPaidSchema>;
