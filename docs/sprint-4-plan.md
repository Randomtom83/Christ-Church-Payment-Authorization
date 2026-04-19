---
file: sprint-4-plan.md
project: Christ Church in Bloomfield & Glen Ridge — ChurchOps
sprint: 4 (Approval Workflow)
date: 2026-04-18
---

# Sprint 4 Plan — Approval Workflow

## Scope

Build the signer approval flow: review pending requisitions, approve or reject with one tap, enforce single/dual approval rules, real-time status updates, badge counts, email notifications on approval events.

Web Push notifications are **deferred** — the browser Push API requires a service worker, VAPID key generation, subscription management, and a push server. This is Sprint 8 polish work. Sprint 4 delivers email notifications and real-time UI updates.

---

## File Inventory

### New Files (10)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/lib/actions/approvals.ts` | Server Actions: `approveRequisition(id)` — validates signer role, checks prevention rules (not own submission, not already approved, not already fully approved), inserts approval record, updates requisition status if thresholds met, writes audit log, sends notifications. `rejectRequisition(id, formData)` — validates reason (min 10 chars), inserts rejection record, sets status to rejected, writes audit log, notifies treasurer + submitter. |
| 2 | `src/lib/validators/approval.ts` | Zod schemas: `rejectSchema` — reason string min 10 chars, max 2000. |
| 3 | `src/components/requisitions/signer-actions.tsx` | Client component: the signer action panel. Shows approve button (green, 56px) with inline confirmation step, reject button (outline/danger) that expands to show reason textarea. Hides buttons if signer is ineligible (own submission, already approved). Shows approval status indicator (who has approved, how many needed). |
| 4 | `src/components/requisitions/signer-queue.tsx` | Client component: signer-specific view with two sections — "Needs My Signature" (pending_approval items not yet approved by this signer) and "Recently Signed" (this signer's approvals in last 30 days). Count badge on primary section. |
| 5 | `src/components/requisitions/approval-status.tsx` | Shared component: shows approval progress for any role. Displays: required count (1 or 2), obtained approvals with signer names and dates (green checkmarks), remaining slots (empty circles). Used on detail page for all roles. |
| 6 | `src/hooks/use-realtime.ts` | Custom hook: subscribes to Supabase Realtime on the requisitions table. Returns live count of pending_approval requisitions for badge display. Cleans up subscription on unmount. |
| 7 | `src/components/layout/nav-badge.tsx` | Small component: renders a count badge (red circle with number) positioned on a nav item. Used by bottom-nav for pending approval count. |
| 8 | `src/lib/db/approvals.ts` | **REPLACE** existing stub. Add: `create(data)` — insert approval record, `getBySignerRecent(signerId, days)` — recent approvals by this signer, `countForRequisition(requisitionId)` — count of approved approvals, `hasSignerApproved(requisitionId, signerId)` — check if signer already acted. |
| 9 | `src/lib/actions/notifications.ts` | **EXTEND** — add `notifySecondApprovalNeeded(req, firstSignerName)` for dual-approval items after first signature. Add `notifyRejection(req, reason, rejectorName)` to notify treasurer + submitter. |
| 10 | `supabase/migrations/008_approval_helpers.sql` | Create a Postgres function `check_and_complete_approval(req_id, signer_id)` that atomically checks approval count and updates status — prevents race condition where two signers approve simultaneously on a single-approval requisition. |

### Modified Files (7)

| # | File | Changes |
|---|------|---------|
| 1 | `src/app/(app)/requisitions/page.tsx` | Detect signer role. If signer (and not also treasurer), render `SignerQueue` instead of plain list. Pass pending count. |
| 2 | `src/app/(app)/requisitions/[id]/page.tsx` | Import and render `SignerActions` when viewer has signer role. Render `ApprovalStatus` for all roles. Fetch existing approvals for this requisition. |
| 3 | `src/components/layout/bottom-nav.tsx` | Accept optional `badges` prop (Record<string, number>). Render `NavBadge` on the Requisitions tab when there are pending items. |
| 4 | `src/app/(app)/layout.tsx` | Fetch pending approval count for signers, pass as badges prop to BottomNav. |
| 5 | `src/lib/db/requisitions.ts` | Add `getPendingForSigner(signerId)` — requisitions in pending_approval that this signer hasn't acted on. Add `getApprovalCountForRequisition(id)` helper. |
| 6 | `src/components/requisitions/requisition-detail.tsx` | Add `prepared_notes` display when present (treasurer notes section). |
| 7 | `src/components/requisitions/requisition-timeline.tsx` | Already has approval labels — verify they render correctly with the new approval data. |

---

## Architecture Decisions

### 1. Approval Race Condition Prevention

The critical edge case: two signers approve a single-approval requisition simultaneously. Both read status as `pending_approval`, both insert approval records, both try to set status to `approved`.

Solution: A Postgres function `check_and_complete_approval` that runs atomically:
1. Lock the requisition row (`SELECT ... FOR UPDATE`)
2. Count existing approved approvals
3. If adding this approval would meet the threshold → insert approval + update status to `approved`
4. If threshold already met → return error "already fully approved"
5. If this signer already approved → return error "already approved by you"

The server action calls this function via `supabase.rpc()`. If the RPC doesn't exist (migration not applied), fall back to the non-atomic JS approach with optimistic checks.

### 2. Signer Queue Logic

A signer sees requisitions where:
- `status = 'pending_approval'`
- The signer has NOT already inserted an approval record for this requisition
- The signer is NOT the submitter (conflict of interest)

This is computed by fetching all `pending_approval` requisitions, then fetching the signer's existing approvals, and filtering client-side. An alternative is a Postgres VIEW, but the JS approach is simpler and the volume is low.

### 3. Who Can See What

| Role | Sees on detail page |
|------|-------------------|
| Submitter | Full details + status + approval progress (names of who approved) |
| Treasurer | Full details + treasurer actions + approval progress |
| Signer | Full details + approve/reject buttons (if eligible) + approval progress |
| Admin | Full details + approval progress |

All roles see the approval status indicator. Only eligible signers see the action buttons.

### 4. Notification Flow

```
Requisition routed (Sprint 3) → Email to all signers
  ↓
Signer 1 approves
  ├─ Single approval: status → approved, email treasurer "Ready to Send"
  └─ Dual approval:
       ├─ First signature: email remaining signers "Second Approval Needed"
       └─ Second signature: status → approved, email treasurer "Ready to Send"

Signer rejects → status → rejected, email treasurer + submitter with reason
```

### 5. Real-Time Updates

Use Supabase Realtime to subscribe to changes on the `requisitions` table:
- Client hook `useRealtime` listens for `UPDATE` events on requisitions
- When a requisition's status changes, the hook triggers a state update
- The bottom nav badge count re-queries on change
- The approval queue list refreshes
- The detail page shows updated approval status

This uses the browser Supabase client (already exists in `src/lib/supabase/client.ts`).

### 6. Push Notifications — Deferred

Web Push requires:
- Service worker registration
- VAPID key pair generation
- Push subscription storage (new table)
- Push server endpoint (API route or Edge Function)
- Permission request UI

This is Sprint 8 polish. Sprint 4 relies on email notifications + real-time UI updates. The email notifications are already working from Sprint 3.

---

## Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | Migration for atomic approval function | `008_approval_helpers.sql` |
| 2 | Approval validator | `validators/approval.ts` |
| 3 | Extend DB functions | Update `db/approvals.ts` (full rewrite), update `db/requisitions.ts` |
| 4 | Extend notifications | Update `actions/notifications.ts` |
| 5 | Approval server actions | `actions/approvals.ts` |
| 6 | Approval status component | `approval-status.tsx` |
| 7 | Signer actions panel | `signer-actions.tsx` |
| 8 | Signer queue component | `signer-queue.tsx` |
| 9 | Realtime hook | `hooks/use-realtime.ts` |
| 10 | Nav badge component | `layout/nav-badge.tsx` |
| 11 | Update bottom nav | `bottom-nav.tsx` |
| 12 | Update app layout | `(app)/layout.tsx` |
| 13 | Update requisitions list page | `requisitions/page.tsx` |
| 14 | Update requisition detail page | `requisitions/[id]/page.tsx` |
| 15 | Build verification + deploy | `npx tsc --noEmit && npx next build && git push` |

---

## Acceptance Criteria

- [ ] Signers see "Needs My Signature" queue with pending requisitions
- [ ] Pending count badge on Requisitions tab in bottom nav
- [ ] Queue excludes requisitions the signer submitted (conflict of interest)
- [ ] Queue excludes requisitions the signer already approved
- [ ] Approve button with inline confirmation step
- [ ] Under $500: single approval completes the requisition
- [ ] $500+: first approval keeps status as pending_approval, second completes it
- [ ] Same signer cannot provide both approvals on dual-approval items
- [ ] Reject button requires reason (min 10 characters)
- [ ] Rejection sets status to "rejected" and notifies treasurer + submitter
- [ ] Approval status indicator visible to all roles (checkmarks + empty circles)
- [ ] Activity timeline shows approval/rejection events with signer names
- [ ] Email: treasurer notified when requisition fully approved
- [ ] Email: remaining signers notified when first of two approvals is done
- [ ] Email: treasurer + submitter notified on rejection
- [ ] Race condition prevented: two simultaneous approvals on single-approval item handled atomically
- [ ] Real-time: badge count updates when another signer approves
- [ ] Real-time: detail page reflects status changes without refresh
- [ ] "Recently Signed" shows signer's approvals from last 30 days
- [ ] All touch targets >= 48px, approve/reject buttons 56px
- [ ] All body text >= 18px
- [ ] Every action writes to audit_log
- [ ] TypeScript compiles, Next.js builds

---

## What This Sprint Does NOT Include

- Web Push notifications — Sprint 8
- Notification preferences (email on/off) — Sprint 8
- Signer assignment (all signers see all pending) — by design, not a missing feature
- Dashboard cards for pending counts — Sprint 6
- Offline approval — Sprint 8

---

## Dependencies / Blockers

- **Migration 008 must be applied** to Supabase for atomic approval checking.
- **Sprint 3 must be complete** — treasurer prepare/route flow working. (Confirmed complete.)
- **At least one user with signer role** and one with treasurer role must exist for testing.
- **Supabase Realtime must be enabled** on the requisitions table (it is by default on Supabase Pro).
