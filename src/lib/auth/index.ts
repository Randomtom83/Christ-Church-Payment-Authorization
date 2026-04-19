import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getProfile, type Profile } from "@/lib/db/profiles";
import type { User } from "@supabase/supabase-js";

export type AuthUser = {
  user: User;
  profile: Profile;
};

/**
 * Get the current authenticated user and their profile.
 * Returns null if not authenticated or profile not found.
 * Use in Server Components and Server Actions.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getProfile(user.id);
  if (!profile) return null;

  return { user, profile };
}

/**
 * Check if a profile's full_name looks auto-generated (from the
 * handle_new_user trigger) and needs to be replaced with a real name.
 *
 * The trigger sets full_name to the phone number (e.g. "+12015551234")
 * or the email username. We detect phone-derived names by checking for
 * a leading "+" or if the name is all digits.
 */
export function profileNeedsName(profile: Profile): boolean {
  const name = profile.full_name.trim();
  if (!name) return true;
  if (name.startsWith("+")) return true;
  // Pure digits = phone-derived
  if (/^\d+$/.test(name)) return true;
  return false;
}
