"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { phoneSchema, toE164, otpSchema } from "@/lib/validators/auth";
import { profileNameSchema } from "@/lib/validators/profile";
import { updateProfileName } from "@/lib/db/profiles";
import { writeAuditLog } from "@/lib/db/audit";

type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Send an OTP code to a phone number via Supabase Auth (Twilio Verify).
 */
export async function sendOtp(rawPhone: string): Promise<ActionResult> {
  const parsed = phoneSchema.safeParse(rawPhone);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const phone = toE164(parsed.data);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    console.error("[sendOtp] Supabase error:", error.message, error.status, error);
    // Rate limiting or Twilio errors
    if (error.message.includes("rate")) {
      return {
        success: false,
        error: "Too many attempts. Please wait a minute and try again.",
      };
    }
    return {
      success: false,
      error: `Failed to send verification code: ${error.message}`,
    };
  }

  return { success: true };
}

/**
 * Verify the OTP code and establish a session.
 */
export async function verifyOtp(
  rawPhone: string,
  rawToken: string,
): Promise<ActionResult> {
  const phoneParsed = phoneSchema.safeParse(rawPhone);
  if (!phoneParsed.success) {
    return { success: false, error: phoneParsed.error.issues[0].message };
  }

  const tokenParsed = otpSchema.safeParse(rawToken);
  if (!tokenParsed.success) {
    return { success: false, error: tokenParsed.error.issues[0].message };
  }

  const phone = toE164(phoneParsed.data);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: tokenParsed.data,
    type: "sms",
  });

  if (error) {
    if (error.message.includes("expired")) {
      return {
        success: false,
        error: "Code expired. Please request a new code.",
      };
    }
    return {
      success: false,
      error: "Invalid code. Please check and try again.",
    };
  }

  if (data.user) {
    await writeAuditLog({
      userId: data.user.id,
      action: "auth.login",
      entityType: "profile",
      entityId: data.user.id,
      details: { method: "sms_otp" },
    });
  }

  return { success: true };
}

/**
 * Update the user's display name (profile completion step).
 */
export async function completeProfile(
  rawName: string,
): Promise<ActionResult> {
  const parsed = profileNameSchema.safeParse({ fullName: rawName });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  await updateProfileName(user.id, parsed.data.fullName);

  await writeAuditLog({
    userId: user.id,
    action: "profile.name_set",
    entityType: "profile",
    entityId: user.id,
    details: { full_name: parsed.data.fullName },
  });

  return { success: true };
}

/**
 * Sign out the current user and redirect to login.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await writeAuditLog({
      userId: user.id,
      action: "auth.logout",
      entityType: "profile",
      entityId: user.id,
    });
  }

  await supabase.auth.signOut();
  redirect("/login");
}
