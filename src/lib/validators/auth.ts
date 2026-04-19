import { z } from "zod";

/**
 * Strip a US phone number to just digits, then validate it's 10 digits.
 * Accepts: (201) 555-1234, 201-555-1234, 201.555.1234, 2015551234, +12015551234
 */
function stripToDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .transform(stripToDigits)
  .pipe(
    z
      .string()
      // Allow 10 (no country code) or 11 starting with 1 (US country code)
      .refine(
        (digits) =>
          digits.length === 10 || (digits.length === 11 && digits.startsWith("1")),
        { message: "Enter a valid 10-digit US phone number" },
      )
      // Normalize to 10 digits (strip leading 1 if present)
      .transform((digits) => (digits.length === 11 ? digits.slice(1) : digits)),
  );

/** Format 10-digit string to +1XXXXXXXXXX for Supabase/Twilio. */
export function toE164(digits: string): string {
  return `+1${digits}`;
}

/** Format 10-digit string to (XXX) XXX-XXXX for display. */
export function formatPhone(digits: string): string {
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export const otpSchema = z
  .string()
  .length(6, "Enter the 6-digit code")
  .regex(/^\d{6}$/, "Code must be 6 digits");
