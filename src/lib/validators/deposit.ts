import { z } from 'zod';

export const checkItemSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => { const n = parseFloat(val); return !isNaN(n) && n > 0; },
    { message: 'Amount must be greater than zero' }
  ),
  category: z.string().min(1, 'Select a category'),
  member_name: z.string().optional(),
  giving_number: z.string().optional(),
  check_number: z.string().optional(),
});

export const cashItemSchema = z.object({
  total_cents: z.number().min(1, 'Cash total must be greater than zero'),
  category: z.string().min(1, 'Select a category'),
  denomination_counts: z.record(z.string(), z.number().min(0)),
});

export const specialItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => { const n = parseFloat(val); return !isNaN(n) && n > 0; },
    { message: 'Amount must be greater than zero' }
  ),
  category: z.string().min(1, 'Select a category'),
});

export const verificationSchema = z.object({
  confirmed: z.literal(true, { error: 'You must confirm the totals match' }),
});

export const rejectionSchema = z.object({
  notes: z.string().min(1, 'Please describe what doesn\'t match'),
});
