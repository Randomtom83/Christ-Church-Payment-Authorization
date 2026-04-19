import "server-only";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/constants";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: Role[];
  entity_access: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Fetch profile for the currently authenticated user (RLS-scoped). */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

/** Fetch all profiles. Requires admin role (bypasses RLS). */
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) throw new Error(`Failed to fetch profiles: ${error.message}`);
  return (data ?? []) as Profile[];
}

/** Update profile name for a user (RLS-scoped — user updates their own). */
export async function updateProfileName(
  userId: string,
  fullName: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (error) throw new Error(`Failed to update profile name: ${error.message}`);
}

/** Update roles for a user. Requires admin (bypasses RLS). */
export async function updateProfileRoles(
  userId: string,
  roles: Role[],
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: roles })
    .eq("id", userId);

  if (error) throw new Error(`Failed to update roles: ${error.message}`);
}

/** Toggle active status for a user. Requires admin (bypasses RLS). */
export async function setProfileActive(
  userId: string,
  isActive: boolean,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) throw new Error(`Failed to update active status: ${error.message}`);
}

/** Get all active profiles with a specific role. Uses admin client. */
export async function getProfilesByRole(role: string): Promise<Profile[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .contains("role", [role])
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) throw new Error(`Failed to fetch profiles by role: ${error.message}`);
  return (data ?? []) as Profile[];
}

/** Get all active signers. */
export async function getSigners(): Promise<Profile[]> {
  return getProfilesByRole("signer");
}

/** Get all active treasurers. */
export async function getTreasurers(): Promise<Profile[]> {
  return getProfilesByRole("treasurer");
}
