import { z } from 'zod';

/** Schema for rejecting a requisition — reason is required. */
export const rejectSchema = z.object({
  reason: z
    .string()
    .min(10, 'Please provide at least 10 characters explaining the rejection')
    .max(2000),
});

export type RejectFormData = z.infer<typeof rejectSchema>;
