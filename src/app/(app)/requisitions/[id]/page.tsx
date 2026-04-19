import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getById } from '@/lib/db/requisitions';
import { getSignedUrl } from '@/lib/db/attachments';
import { getAll as getAllAccounts } from '@/lib/db/accounts';
import { createClient } from '@/lib/supabase/server';
import { RequisitionDetail } from '@/components/requisitions/requisition-detail';
import { RequisitionTimeline } from '@/components/requisitions/requisition-timeline';
import { TreasurerActions } from '@/components/requisitions/treasurer-actions';
import { ReturnBanner } from '@/components/requisitions/return-banner';

export const metadata: Metadata = { title: 'Requisition Detail' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function RequisitionDetailPage({ params, searchParams }: Props) {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const { id } = await params;
  const { success } = await searchParams;

  const requisition = await getById(id);
  if (!requisition) notFound();

  const roles = auth.profile.role as string[];
  const isTreasurer = roles.includes('treasurer') || roles.includes('admin');
  const isSubmitter = requisition.submitted_by === auth.profile.id;

  // Get signed URLs for attachments
  const attachmentUrls: Record<string, string> = {};
  for (const att of requisition.attachments) {
    try {
      attachmentUrls[att.id] = await getSignedUrl(att.file_path);
    } catch {
      // Skip files that can't be accessed
    }
  }

  // Get audit log entries for the timeline
  const supabase = await createClient();
  const { data: auditEntries } = await supabase
    .from('audit_log')
    .select('id, action, user_id, details, created_at')
    .eq('entity_type', 'requisition')
    .eq('entity_id', id)
    .order('created_at', { ascending: true });

  const enriched = await enrichAuditEntries(auditEntries ?? []);

  // Fetch accounts for treasurer actions (account assignment)
  const accounts = isTreasurer ? await getAllAccounts() : [];

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      {/* Success banner */}
      {success === 'true' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4" role="status">
          <p className="text-lg text-green-800 font-semibold">
            Requisition #{requisition.req_number} submitted successfully!
          </p>
        </div>
      )}

      {/* Return banner (shown to submitter when status is returned) */}
      {requisition.status === 'returned' && requisition.returned_reason && (
        <ReturnBanner
          reason={requisition.returned_reason}
          requisitionId={requisition.id}
          isSubmitter={isSubmitter}
        />
      )}

      <RequisitionDetail
        requisition={requisition}
        currentUserId={auth.profile.id}
        attachmentUrls={attachmentUrls}
      />

      {/* Treasurer actions (prepare, return, mark paid) */}
      {isTreasurer && (
        <TreasurerActions requisition={requisition} accounts={accounts} />
      )}

      <RequisitionTimeline entries={enriched} />
    </div>
  );
}

/** Attach user names to audit entries. */
async function enrichAuditEntries(
  entries: Array<{ id: string; action: string; user_id: string | null; details: Record<string, unknown> | null; created_at: string }>
) {
  if (entries.length === 0) return [];

  const supabase = await createClient();
  const userIds = [...new Set(entries.map((e) => e.user_id).filter(Boolean))] as string[];

  let userMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profiles) {
      userMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]));
    }
  }

  return entries.map((e) => ({
    ...e,
    user_name: e.user_id ? userMap[e.user_id] ?? 'Unknown' : undefined,
  }));
}
