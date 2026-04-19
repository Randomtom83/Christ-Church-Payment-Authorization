---
file: sprint-3-plan.md
project: Christ Church in Bloomfield & Glen Ridge — ChurchOps
sprint: 3 (Treasurer Workflow)
date: 2026-04-18
---

# Sprint 3 Plan — Treasurer Workflow

## Scope

Build Bonnie's digital queue: review submitted requisitions, assign account codes, enter check numbers, route for signer approval, track through payment, export to CSV. Add email notifications for workflow transitions.

---

## File Inventory

### New Files (14)

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase/migrations/007_treasurer_workflow.sql` | Add `returned` to requisition status check constraint. Add `returned_reason` TEXT column. Add `payment_date` DATE column. Add `payment_reference` TEXT column (for online payment confirmation numbers). Add `prepared_notes` TEXT column (Bonnie's internal notes). Fix status constraint to include `cancelled` and `returned`. |
| 2 | `src/lib/actions/notifications.ts` | Email notification helper. Wraps Resend SDK (or console.log fallback if not configured). Exports `notifyTreasurer(requisition)`, `notifySigners(requisition)`, `notifySubmitter(requisition, reason)`, `notifyTreasurerApproved(requisition)`. Each builds subject/body and calls `sendEmail`. Reads recipient emails from profiles table. Skips silently if no email on profile or if Resend API key is missing. |
| 3 | `src/lib/validators/treasurer.ts` | Zod schemas: `prepareSchema` — validates account_id (required for routing), check_number (optional), prepared_notes (optional). `returnSchema` — validates reason (required string). `markPaidSchema` — validates payment_date (required), payment_reference (optional). |
| 4 | `src/components/requisitions/treasurer-actions.tsx` | Client component: the treasurer action panel shown on the detail page. Renders conditionally based on requisition status: (a) status=submitted → "Assign Account" + "Check Number" + "Prepare & Route" + "Return to Submitter", (b) status=approved → "Mark as Paid" section. Visually distinct card with light background. All buttons 56px with icons. |
| 5 | `src/components/requisitions/treasurer-queue.tsx` | Client component: tabbed queue view for treasurer. Tabs: "Needs Review" (submitted), "Pending Signatures" (pending_approval), "Ready to Send" (approved), "Completed" (paid), "All". Count badges on each tab. Renders `RequisitionList` filtered by the selected tab. Default tab: "Needs Review". |
| 6 | `src/components/requisitions/csv-export.tsx` | Client component: export dialog/section. Date range picker (from/to), entity filter (All/CC/NSCC), status filter. "Export CSV" button that calls a server action to generate and download the CSV. Accessible from requisitions list page (treasurer/admin only). |
| 7 | `src/lib/actions/treasurer.ts` | Server Actions: `prepareRequisition(id, formData)` — validates, updates account_id + check_number + notes, sets status to pending_approval, writes audit log, sends email to signers. `returnRequisition(id, formData)` — validates reason, sets status to returned + stores reason, writes audit log, emails submitter. `markAsPaid(id, formData)` — validates, sets status to paid + payment_date + reference, writes audit log, sends no email (Bonnie is already looking at it). |
| 8 | `src/lib/actions/export.ts` | Server Action: `exportRequisitionsCSV(formData)` — queries requisitions by date range + entity + status, joins account/submitter/approvals, formats as CSV string, returns as downloadable content. Columns: Date Submitted, Date Paid, Req Number, Payee, Description, Amount, Account Code, Account Name, Category, Entity, Payment Method, Check Number, Status, Submitted By, Approved By. |
| 9 | `src/lib/db/approvals.ts` | Database query functions: `getByRequisition(requisitionId)` — all approvals for a requisition. Needed for CSV export "Approved By" column and for detail page in Sprint 4. Stub for now with just the read function. |
| 10 | `src/components/requisitions/return-banner.tsx` | Small component: shows a warning banner on the detail page when a requisition has been returned, displaying the reason. Visible to the submitter so they know what to fix. |
| 11 | `src/app/api/export/route.ts` | API route handler for CSV download. Receives POST with filters, calls export logic, returns Response with `text/csv` content-type and `Content-Disposition` header for browser download. This is one of the few cases where an API route is appropriate (file download vs. server action). |
| 12 | `src/components/requisitions/edit-requisition-form.tsx` | Client component: a simplified edit form for when a submitter needs to fix a returned requisition. Shows the return reason at top, then editable fields (same as the create form but pre-filled). On submit, updates the requisition and sets status back to "submitted". |
| 13 | `src/lib/actions/resubmit.ts` | Server Action: `resubmitRequisition(id, formData)` — verifies caller is submitter, status is "returned", validates updated fields, updates the requisition row, sets status back to "submitted", writes audit log, notifies treasurer. |
| 14 | `src/app/(app)/requisitions/[id]/edit/page.tsx` | Page for editing a returned requisition. Server component that fetches requisition, verifies status is "returned" and caller is submitter, renders EditRequisitionForm. |

### Modified Files (8)

| # | File | Changes |
|---|------|---------|
| 1 | `src/lib/constants.ts` | Add `returned` and `cancelled` to REQUISITION_STATUSES array. |
| 2 | `src/app/(app)/requisitions/page.tsx` | Detect treasurer role. If treasurer, render `TreasurerQueue` instead of plain `RequisitionList`. Add "Export" button (treasurer/admin only). |
| 3 | `src/app/(app)/requisitions/[id]/page.tsx` | Import and render `TreasurerActions` component when viewer has treasurer role. Show `ReturnBanner` when status is "returned". Add "Edit & Resubmit" link when status is "returned" and viewer is submitter. |
| 4 | `src/components/requisitions/requisition-detail.tsx` | Add display fields for: check_number, prepared_notes, payment_date, payment_reference, returned_reason. Show "Returned" banner. Show "Edit & Resubmit" button for submitter when status=returned. |
| 5 | `src/components/requisitions/status-badge.tsx` | Add `returned` status config (orange/warning, undo icon). |
| 6 | `src/lib/db/requisitions.ts` | Add `getByStatus(status)`, `getCountsByStatus()` (returns counts for each status for queue badges), `updatePrepare(id, data)`, `updatePaid(id, data)`, `updateReturn(id, reason)`, `updateResubmit(id, data)`. Update `Requisition` type to include new columns. |
| 7 | `src/lib/db/profiles.ts` | Add `getSigners()` — returns all active profiles with 'signer' role. Add `getTreasurers()` — returns all active profiles with 'treasurer' role. Add `getProfilesByRole(role)` helper. |
| 8 | `src/components/requisitions/requisition-timeline.tsx` | Add action labels for new statuses: `requisition.prepared`, `requisition.returned`, `requisition.paid`, `requisition.resubmitted`. |

### Dependencies to Install (1)

| Package | Purpose |
|---------|---------|
| `resend` | Transactional email API. If install fails or API key not set, notifications fall back to console.log. |

---

## Architecture Decisions

### 1. Treasurer Queue vs. Separate Dashboard

The treasurer queue replaces the generic requisition list when the viewer has the `treasurer` role. It's the same URL (`/requisitions`) but renders a tabbed queue interface instead. This means:
- Bonnie bookmarks one URL
- The bottom nav "Requisitions" tab goes straight to her queue
- No separate treasurer dashboard page needed

### 2. Status Flow

```
submitted ←──────────────────────────┐
    ↓                                │
returned ─── (submitter edits) ──────┘
    
submitted
    ↓ (treasurer prepares)
pending_approval
    ↓ (signers approve — Sprint 4)
approved
    ↓ (treasurer marks paid)
paid

submitted → cancelled (submitter cancels)
```

The `returned` status is new. When Bonnie returns a requisition:
1. Status changes to `returned`
2. `returned_reason` is stored on the requisition row
3. Submitter gets an email notification
4. Submitter sees "Returned" banner with reason on the detail page
5. Submitter can edit and resubmit → status goes back to `submitted`

### 3. Email Notification Strategy

Emails are fire-and-forget — failures never block the workflow. The notification module:
1. Checks if Resend API key is configured (`RESEND_API_KEY` in env)
2. If not configured, logs to console and returns success
3. If configured, sends via Resend with a simple text template
4. If send fails, logs error and returns success (never throws)

Email addresses come from `profiles.email`. Users without email (phone-only auth) don't get notifications — acceptable for now.

### 4. CSV Export via API Route

CSV downloads need a proper HTTP response with Content-Disposition headers. Server Actions return data to React, not downloadable files. So the export uses an API route (`/api/export`) — one of the few cases where an API route is appropriate per CLAUDE.md.

The client component sends a POST request with filter parameters, receives the CSV as a blob, and triggers a browser download.

### 5. Approval Routing

Sprint 3 prepares the requisition for approval but doesn't implement the approval UI (that's Sprint 4). When Bonnie clicks "Prepare & Route":
- Status changes to `pending_approval`
- Email goes to ALL active signers (not assigned to specific people)
- The `requires_dual_approval` computed column tells how many signatures are needed
- Sprint 4 will add the signer queue and approve/reject actions

### 6. Resubmission After Return

When a requisition is returned and the submitter edits it:
- A dedicated edit page (`/requisitions/[id]/edit`) shows the return reason + editable form
- The edit pre-fills all existing values
- On submit, the requisition is updated in place (same row, same req_number)
- Status goes back to `submitted`
- Bonnie gets notified again
- Audit log shows the full history: submitted → returned → resubmitted

---

## Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | Install resend, update constants | `package.json`, `constants.ts` |
| 2 | Database migration | `007_treasurer_workflow.sql` |
| 3 | Validators | `validators/treasurer.ts` |
| 4 | DB query functions | Update `db/requisitions.ts`, `db/profiles.ts`, new `db/approvals.ts` |
| 5 | Notification helper | `actions/notifications.ts` |
| 6 | Treasurer server actions | `actions/treasurer.ts` |
| 7 | Resubmit action | `actions/resubmit.ts` |
| 8 | Export action + API route | `actions/export.ts`, `api/export/route.ts` |
| 9 | Status badge update | `status-badge.tsx` update |
| 10 | Timeline update | `requisition-timeline.tsx` update |
| 11 | Return banner | `return-banner.tsx` |
| 12 | Treasurer actions panel | `treasurer-actions.tsx` |
| 13 | Treasurer queue | `treasurer-queue.tsx` |
| 14 | CSV export UI | `csv-export.tsx` |
| 15 | Edit form for returned requisitions | `edit-requisition-form.tsx` |
| 16 | Update detail page | `requisitions/[id]/page.tsx` update |
| 17 | Edit page | `requisitions/[id]/edit/page.tsx` |
| 18 | Update list page | `requisitions/page.tsx` update |
| 19 | Update requisition detail component | `requisition-detail.tsx` update |
| 20 | Build verification + deploy | `npx tsc --noEmit && npx next build && git push` |

---

## Acceptance Criteria

- [ ] Treasurer sees tabbed queue with count badges (Needs Review, Pending Signatures, Ready to Send, Completed, All)
- [ ] Default tab is "Needs Review" showing submitted requisitions, oldest first
- [ ] Treasurer can assign/edit account code on a submitted requisition
- [ ] Treasurer can enter check number (check payments only)
- [ ] Treasurer can add internal notes
- [ ] "Prepare & Route" validates account is assigned, sets status to pending_approval
- [ ] Approval requirement determined: < $500 = 1 signer, >= $500 = 2 signers
- [ ] "Return to Submitter" requires a reason, sets status to returned
- [ ] Returned requisition shows reason banner to submitter
- [ ] Submitter can edit and resubmit a returned requisition
- [ ] Resubmitted requisition goes back to "submitted" status
- [ ] Approved requisitions appear in "Ready to Send" tab
- [ ] "Mark as Paid" captures payment date and optional reference number
- [ ] CSV export with date range, entity, and status filters
- [ ] CSV includes all required columns for QuickBooks data entry
- [ ] Email: treasurer notified on new submission
- [ ] Email: all signers notified when requisition routed for approval
- [ ] Email: submitter notified when requisition returned
- [ ] Email: treasurer notified when requisition fully approved
- [ ] Email failures don't block workflow
- [ ] All new actions write to audit_log
- [ ] Timeline shows all new action labels (prepared, returned, paid, resubmitted)
- [ ] All touch targets >= 48px, primary buttons 56px
- [ ] All body text >= 18px
- [ ] TypeScript compiles, Next.js builds

---

## What This Sprint Does NOT Include

- Signer approval/reject UI — Sprint 4
- Push notifications — Sprint 4
- Notification preferences — Sprint 8
- QuickBooks API integration — Sprint 7 (CSV export is the bridge)
- Vendor CRUD — not yet needed
- Real-time updates — Sprint 6

---

## Dependencies / Blockers

- **Resend API key** (`RESEND_API_KEY`) needed in `.env.local` and Vercel env vars for email to work. If not configured, notifications fall back to console.log. Sign up at resend.com (free tier = 100 emails/day).
- **Migration 007 must be applied** to Supabase before testing treasurer actions.
- **Sprint 2 must be complete** — requisition form, detail page, list page all working. (Confirmed complete.)
- **At least one user with treasurer role** must exist in profiles for queue testing.
