import "server-only";

import { createClient } from "@/lib/supabase/server";

type AuditEntry = {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
};

/**
 * Write to the audit_log table. Per CLAUDE.md: every state change writes here.
 * No exceptions.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_log").insert({
    user_id: entry.userId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    details: entry.details ?? null,
  });

  if (error) {
    // Audit failures should not crash the app, but we log them.
    console.error("Audit log write failed:", error.message, entry);
  }
}
