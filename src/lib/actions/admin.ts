"use server";

import { getCurrentUser } from "@/lib/auth";
import { updateProfileRoles, setProfileActive } from "@/lib/db/profiles";
import { writeAuditLog } from "@/lib/db/audit";
import { profileRolesSchema } from "@/lib/validators/profile";
import type { Role } from "@/lib/constants";

type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Update a user's roles. Admin-only.
 */
export async function updateUserRoles(
  targetUserId: string,
  roles: Role[],
): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth || !auth.profile.role.includes("admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = profileRolesSchema.safeParse({ roles });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await updateProfileRoles(targetUserId, parsed.data.roles);

    await writeAuditLog({
      userId: auth.user.id,
      action: "profile.roles_updated",
      entityType: "profile",
      entityId: targetUserId,
      details: {
        new_roles: parsed.data.roles,
        updated_by: auth.user.id,
      },
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update roles";
    return { success: false, error: message };
  }
}

/**
 * Toggle a user's active status. Admin-only.
 */
export async function toggleUserActive(
  targetUserId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const auth = await getCurrentUser();
  if (!auth || !auth.profile.role.includes("admin")) {
    return { success: false, error: "Unauthorized" };
  }

  // Prevent admin from deactivating themselves
  if (targetUserId === auth.user.id && !isActive) {
    return { success: false, error: "You cannot deactivate your own account" };
  }

  try {
    await setProfileActive(targetUserId, isActive);

    await writeAuditLog({
      userId: auth.user.id,
      action: isActive ? "profile.activated" : "profile.deactivated",
      entityType: "profile",
      entityId: targetUserId,
      details: { updated_by: auth.user.id },
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update status";
    return { success: false, error: message };
  }
}
