---
file: sprint-2-plan.md
project: Christ Church in Bloomfield & Glen Ridge — ChurchOps
sprint: 2 (Requisition Submission)
date: 2026-04-18
updated: 2026-04-18
---

# Sprint 2 Plan — Requisition Submission

## Scope

Build the full requisition submission flow: form with camera/file upload, requisition detail view, "My Requisitions" list, and reusable templates. Seed the chart of accounts (real numbers from Bonnie's QBO exports) and vendor lists for both entities.

Google OAuth remains deferred (same as Sprint 1).

---

## Data Sources (from Bonnie — `docs/FromBonnie/`)

| File | Contents | Records |
|------|----------|---------|
| `CC Chart of accounts.xlsx` | Full QBO account list for Christ Church. **New 4000/7000-series numbering is already live** — old codes appear in the Description column. | ~280 accounts (we seed ~70 leaf-level income + expense) |
| `NSCC Chart of accounts.xlsx` | Full QBO account list for Nursery School. Uses 300/400-series numbering. | ~130 accounts (we seed ~50 leaf-level income + expense) |
| `CC Vendor list.xlsx` | All Christ Church vendors from QBO. Name, phone, email, address, QBO account #. | 986 vendors |
| `NSCC Vendor list.xlsx` | All Nursery School vendors from QBO. Name, phone, email, address. | 1,009 vendors |
| `ACS - Copy.csv` | ACS Realm member list with giving numbers, addresses, email, phone. | 83 members |

**Member seeding is deferred to Sprint 5** (counter module). The member list will be seeded when we build the pledge entry flow.

---

## File Inventory

### New Files (23)

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase/migrations/003_seed_accounts.sql` | Seed chart of accounts for both entities using **real account numbers from Bonnie's QBO exports**. CC uses new 4000-series (income) and 7000-series (expense) as `code`, with old 300/400-series as `legacy_code`. NSCC uses existing 300/400-series as `code`. Only seeds leaf-level accounts (the ones you actually post transactions to), not parent category headers. Sets `display_order` to group by category. See "Account Seed Data" section below for full list. |
| 2 | `supabase/migrations/004_storage_bucket.sql` | Creates the `attachments` storage bucket in Supabase if it doesn't exist, plus storage RLS policies: authenticated users can upload to `requisitions/{any}/{any}`, users can read files from requisitions they can see (via requisition RLS). |
| 3 | `supabase/migrations/005_seed_vendors.sql` | Seed vendors for both entities from Bonnie's QBO vendor exports. ~986 CC vendors + ~1,009 NSCC vendors (69 overlap — those get `entity = NULL` meaning available to both). Includes name, phone, email, address where available. Generated from Excel data via helper script. |
| 4 | `scripts/generate-vendor-seed.py` | One-time helper script: reads `CC Vendor list.xlsx` and `NSCC Vendor list.xlsx`, deduplicates, and generates `005_seed_vendors.sql`. Not part of the app runtime — used only to produce the migration. |
| 5 | `src/lib/db/accounts.ts` | Database query functions: `getByEntity(entity)` — returns active accounts filtered by entity, ordered by `display_order`; `getAll()` — returns all active accounts; `getById(id)` — single account lookup. All use server Supabase client. |
| 6 | `src/lib/db/vendors.ts` | Database query functions: `search(query, entity?)` — full-text search on vendor name, optionally filtered by entity; `getAll(entity?)` — all active vendors; `getById(id)` — single vendor with joined default account. |
| 7 | `src/lib/db/requisitions.ts` | Database query functions: `getById(id)` — single requisition with joined account, vendor, submitter profile, and attachments; `getByUser(userId)` — user's own requisitions ordered by date desc; `getAll()` — all requisitions (for treasurer/admin); `getPendingForSigner(userId)` — requisitions needing signer action (stub for Sprint 4); `create(data)` — insert requisition row; `updateStatus(id, status)` — change status with timestamp. |
| 8 | `src/lib/db/templates.ts` | Database query functions: `getByUser(userId)` — templates created by user, ordered by `last_used_at` desc; `getById(id)` — single template with joined account; `create(data)` — insert template; `update(id, data)` — update template fields; `remove(id)` — soft delete (set `is_active = false`); `incrementUseCount(id)` — bump `use_count` and set `last_used_at`. |
| 9 | `src/lib/db/attachments.ts` | Database query functions: `getByRequisition(requisitionId)` — all attachments for a requisition; `create(data)` — insert attachment record; `remove(id)` — delete attachment record and corresponding storage file. |
| 10 | `src/lib/validators/requisition.ts` | Zod schemas: `requisitionSchema` — validates entity, payee_name, amount (positive number), account_id (uuid), payment_method (check/online), description (required). `templateSchema` — validates template name + same fields as requisition but amount is optional (nullable). Shared between client form and server actions. |
| 11 | `src/lib/actions/requisitions.ts` | Server Actions: `createRequisition(formData)` — validates, inserts requisition, uploads attachments to Supabase Storage (`attachments/requisitions/{id}/{filename}`), creates attachment records, writes audit log, returns the new requisition id. `cancelRequisition(id)` — verifies caller is the submitter and status is "submitted", sets status to "cancelled", writes audit log. |
| 12 | `src/lib/actions/templates.ts` | Server Actions: `createTemplate(formData)` — validates, inserts template, writes audit log. `updateTemplate(id, formData)` — validates, updates template, writes audit log. `deleteTemplate(id)` — verifies ownership, soft-deletes, writes audit log. `submitFromTemplate(templateId, overrides?)` — loads template, merges overrides (e.g. different amount), calls createRequisition internally, increments template use count. |
| 13 | `src/lib/utils/currency.ts` | Money formatting utility: `formatCurrency(cents)` — formats integer cents to "$1,234.56" using `Intl.NumberFormat`; `dollarsToCents(dollars)` — converts decimal dollars to integer cents for calculations; `centsToDollars(cents)` — reverse. Per CLAUDE.md, never use float for money. |
| 14 | `src/lib/utils/dates.ts` | Date formatting utility: `formatDate(date)` — formats to "Apr 18, 2026" in America/New_York; `formatDateTime(date)` — formats to "Apr 18, 2026 at 2:30 PM" in America/New_York; `formatRelative(date)` — "2 hours ago", "Yesterday", etc. Uses `date-fns` and `date-fns-tz`. |
| 15 | `src/hooks/use-camera.ts` | Custom React hook: `useCamera()` — returns `{ captureImage }` function that triggers the file input with `capture="environment"`. Handles the result as a `File` object. Also provides `compressImage(file)` — client-side compression using canvas: max 1920px wide, JPEG quality 0.8, returns compressed `File`. |
| 16 | `src/components/shared/file-upload.tsx` | Client component: combined file upload + camera capture UI. Shows "Take Photo" button (prominent, uses camera) and "Choose File" area (drag-and-drop or browse). Accepts jpg, png, heic, pdf. Max 5MB per file. Shows preview thumbnails of attached files with remove buttons. Calls `compressImage` on image files before passing up. Passes files to parent via callback. |
| 17 | `src/components/shared/searchable-select.tsx` | Client component: accessible searchable dropdown. Text input with filtered dropdown list. Keyboard navigable (arrow keys, enter, escape). Groups items by category when `groupBy` prop is provided. Used for both account selector and vendor search. 48px minimum height, visible label. |
| 18 | `src/components/requisitions/requisition-form.tsx` | Client component: the main requisition form. All fields per spec: entity radio buttons (56px tall each), payee name, optional vendor search, amount, account selector (grouped by category, filtered by entity), payment method radios, description textarea, file upload. "Save as Template" toggle with template name field. Validates on blur (Zod). Loading state on submit. Calls `createRequisition` server action. On success redirects to `/requisitions/{id}?success=true`. |
| 19 | `src/components/requisitions/requisition-detail.tsx` | Client component: read-only card display of all requisition fields. Status badge at top. Attached files as thumbnail gallery (tap to view full). "Cancel" button visible only if current user is submitter AND status is "submitted". Calls `cancelRequisition` server action. |
| 20 | `src/components/requisitions/requisition-list.tsx` | Client component: list of requisition cards. Each shows payee, amount (formatted currency), date submitted, status badge. Sorted by most recent. Tap navigates to detail page. Empty state message when no requisitions. |
| 21 | `src/components/requisitions/requisition-timeline.tsx` | Server or client component: activity timeline for a requisition. Pulls from `audit_log` where `entity_type = 'requisition'` and `entity_id = requisition.id`. Shows: "Submitted by X at time", "Prepared by X at time", "Approved by X at time", etc. Chronological order, most recent at bottom. |
| 22 | `src/components/requisitions/template-list.tsx` | Client component: list of user's saved templates. Each shows template name, payee, amount (or "Varies"), account name. "Use Template" button opens `/requisitions/new?template={id}`. Edit and delete options (with confirmation on delete). |
| 23 | `src/components/requisitions/status-badge.tsx` | Shared component: renders the correct status badge for a requisition. Maps status string to icon + color + text per CLAUDE.md pattern. Statuses: submitted (blue/clock), prepared (amber/clipboard), pending_approval (amber/clock), approved (green/check), paid (green/banknote), rejected (red/x), cancelled (gray/slash). |

### Modified Files (4)

| # | File | Changes |
|---|------|---------|
| 1 | `src/app/(app)/requisitions/page.tsx` | Replace placeholder with real implementation. Server component that fetches requisitions based on user role (own for submitter, all for treasurer/admin). Renders `RequisitionList` component. Shows "New Requisition" button at top and link to "My Templates". |
| 2 | `src/app/(app)/requisitions/new/page.tsx` | Replace placeholder with real implementation. Server component that fetches accounts and vendors, reads optional `?template={id}` search param to pre-fill from template. Renders `RequisitionForm` with accounts, vendors, and optional template data as props. |
| 3 | `src/app/(app)/requisitions/[id]/page.tsx` | Replace placeholder with real implementation. Server component that fetches the requisition by id (with joined data), fetches audit log entries. Renders `RequisitionDetail` and `RequisitionTimeline`. Shows success banner if `?success=true` in URL. 404 if requisition not found or not authorized. |
| 4 | `src/app/(app)/requisitions/templates/page.tsx` | Replace placeholder with real implementation. Server component that fetches user's templates. Renders `TemplateList`. Link back to requisitions list. |

### Dependencies to Install (2)

| Package | Purpose |
|---------|---------|
| `date-fns` | Date formatting and relative time calculations |
| `date-fns-tz` | Timezone-aware formatting (America/New_York display) |

**Note:** Check if these are already installed before adding.

---

## Architecture Decisions

### 1. Money Handling

Per CLAUDE.md: database stores `DECIMAL(10,2)`, JavaScript uses integer cents for calculations.

- The form accepts dollar input (e.g., "350.00") as a string
- On submit, parse to cents: `Math.round(parseFloat(value) * 100)`
- Server action validates and stores as DECIMAL via Supabase (which handles the conversion)
- On display, format using `Intl.NumberFormat`
- The `currency.ts` utility handles all conversions — no ad-hoc formatting anywhere

### 2. File Upload Flow

```
User taps "Take Photo" or "Choose File"
  ↓
Browser file picker / camera opens
  ↓
File selected → compressImage() runs client-side
  (max 1920px wide, JPEG quality 0.8, ≤5MB check)
  ↓
Preview thumbnail shown, file held in form state
  ↓
User submits form → createRequisition server action called
  ↓
Server action:
  1. Validate form data (Zod)
  2. Insert requisition row → get requisition ID
  3. For each file:
     a. Upload to Supabase Storage: attachments/requisitions/{req_id}/{filename}
     b. Insert attachment record with file_path, file_name, file_type, file_size
  4. Write audit log
  5. Return requisition ID
```

Files are uploaded via the server action using FormData. The server action receives the files, uploads them to Supabase Storage using the admin client (to bypass storage RLS during creation), and creates attachment records.

### 3. Account Selector

The account dropdown is the most complex form element:
- Filtered by the selected entity (church vs NSCC)
- Grouped by category (A. Clergy Expense, B. Building Expense, etc.)
- Searchable by name (users type "music" to find "Hired Music")
- Shows account name prominently, category as group header
- Does NOT show account codes to submitters — codes are internal for Bonnie

When the user changes entity, the account list re-filters. If they had selected an account from the other entity, it clears.

### 4. Vendor Search (Optional)

The vendor search is optional — many requisitions are for one-off payees. Flow:
- User can type directly in the "Payee Name" field (free text)
- OR user can search vendors in the "Search Existing Vendors" dropdown
- When a vendor is selected: payee name auto-fills, and if the vendor has a `default_account_id`, the account selector pre-selects it
- User can override any auto-filled value
- If no vendors exist yet (likely in early use), the vendor search simply shows "No vendors found"

### 5. Template System

Templates save all requisition fields except files. When using a template:
- Form pre-fills with all template values
- Amount can be pre-filled or left blank (if template amount is NULL, meaning "varies")
- User can modify any field before submitting
- The submitted requisition links back to the template via `template_id`
- Template `use_count` increments and `last_used_at` updates

"Save as Template" is a toggle at the bottom of the form. When toggled on, a "Template Name" field appears. On form submit, both the requisition AND the template are created in the same server action.

### 6. Role-Based List Filtering

The requisitions list page uses server-side role checking to determine what to fetch:

| Role | Sees |
|------|------|
| submitter (only) | Own requisitions only |
| treasurer | All requisitions (will get queue features in Sprint 3) |
| signer | All requisitions (will get approval queue in Sprint 4) |
| admin | All requisitions |

If user has multiple roles (e.g., submitter + signer), they see the broadest view. RLS policies enforce this at the database level.

### 7. Requisition Status Flow (Sprint 2 Scope)

Sprint 2 only implements the first step:
```
submitted ← NEW in this sprint
  ↓ (Sprint 3: treasurer prepares)
prepared
  ↓ (Sprint 3: treasurer routes for approval)
pending_approval
  ↓ (Sprint 4: signers approve)
approved
  ↓ (Sprint 3: treasurer marks paid)
paid
```

Sprint 2 also implements:
```
submitted → cancelled (submitter cancels their own)
```

The detail page and timeline will show all statuses, but only "submitted" and "cancelled" transitions happen in Sprint 2.

### 8. Storage Bucket Setup

Supabase Storage requires a bucket to be created. Migration 004 creates it via SQL using `storage.buckets`. RLS policies on `storage.objects`:
- Authenticated users can INSERT to `attachments/requisitions/*`
- Users can SELECT files from requisitions they have access to (checked via requisitions RLS)
- Only uploaders or admins can DELETE files

**Note:** Supabase Storage bucket creation via SQL may need to be done through the dashboard instead if the migration approach doesn't work with the hosted Supabase. In that case, 004 becomes just the RLS policies and we document the manual bucket creation step.

### 9. Vendor Seed Strategy

~1,926 unique vendors across both entities. Generated via `scripts/generate-vendor-seed.py` which reads the Excel files:

- Vendors that appear in BOTH CC and NSCC lists (69 vendors): seeded with `entity = NULL` (available to both)
- CC-only vendors (917): seeded with `entity = 'church'`
- NSCC-only vendors (940): seeded with `entity = 'nscc'`
- Includes phone, email, address where available in the Excel data
- `qb_vendor_id` is not populated (QBO API sync is Sprint 7)
- `default_account_id` is not populated (would require manual mapping; users pick accounts per requisition)

---

## Account Seed Data

These are the **real account numbers** from Bonnie's QBO exports (April 2026). CC has completed renumbering to 4000/7000-series.

### Christ Church — Income Accounts (A. Parish Generated Income)

| code | legacy_code | name | category |
|------|-------------|------|----------|
| 4005 | 301 | Plate | A. Parish Generated Income |
| 4010 | 310-01 | Pledges - Current Year | A. Parish Generated Income |
| 4025 | 315-01 | Christmas | A. Parish Generated Income |
| 4030 | 315-03 | Easter | A. Parish Generated Income |
| 4035 | 315-04 | Thanksgiving | A. Parish Generated Income |
| 4040 | 315-07 | Flower Donations | A. Parish Generated Income |
| 4045 | 315-06 | Offering | A. Parish Generated Income |
| 4050 | 315-08 | Other Contributions | A. Parish Generated Income |
| 4055 | 315-09 | Memorial Offerings | A. Parish Generated Income |
| 4058 | 315-05 | Theological Education Offering | A. Parish Generated Income |
| 4060 | 317 | Designated Contributions | A. Parish Generated Income |
| 4065 | 319 | Outreach Contributions | A. Parish Generated Income |

### Christ Church — Expense Accounts

| code | legacy_code | name | category |
|------|-------------|------|----------|
| 7135 | 404-01 | Supply & Substitute Priest | A. Clergy Expense |
| 7140 | 406 | Health Insurance | A. Clergy Expense |
| 7145 | 428 | Clergy - Misc. | A. Clergy Expense |
| 7150 | 436 | Continuing Education | A. Clergy Expense |
| 7130 | 404 | Auto and Business Expenses | A. Clergy Expense |
| 7235 | 410-a | Replacement and Repair | B. Building Expense |
| 7240 | 410-b | General Maintenance | B. Building Expense |
| 7245 | 410-c | Landscaping | B. Building Expense |
| 7250 | 410-01 | Sexton Substitute | B. Building Expense |
| 7261 | 412-02 | Gas & Electricity - 72 Park | B. Building Expense |
| 7262 | 412-04 | Gas & Electricity - 74 Park | B. Building Expense |
| 7263 | 412-05 | Solar Expense | B. Building Expense |
| 7265 | 413 | Water-Sewer | B. Building Expense |
| 7271 | 414-01 | Janitorial | B. Building Expense |
| 7272 | 414-02 | Kitchen | B. Building Expense |
| 7340 | 423 | Office Supplies/Expenses | C. Administration Expense |
| 7345 | 425 | Computer Expenses | C. Administration Expense |
| 7350 | 426 | Copier Expenses | C. Administration Expense |
| 7355 | 427 | Telephone/Data | C. Administration Expense |
| 7360 | 432 | Deacon Expenses & Miscellaneous | C. Administration Expense |
| 7365 | 452 | Vanco Fees | C. Administration Expense |
| 7370 | 453 | Audit Fees | C. Administration Expense |
| 7405 | 408 | Diocesan Pledge | D. Outreach Expense |
| 7410 | 422-01 | Outreach - Church | D. Outreach Expense |
| 7415 | 422-02 | Outreach - Local Community | D. Outreach Expense |
| 7420 | 422-03 | Outreach - Rector Disc. Fund | D. Outreach Expense |
| 7525 | 415-a | Hired Music | E. Worship Expense |
| 7530 | 415-b | Holiday Music | E. Worship Expense |
| 7535 | 415-c | Sheet Music, Organ Maintenance | E. Worship Expense |
| 7540 | 415-d | Organist Substitute | E. Worship Expense |
| 7545 | 415-s | Music Director Substitute | E. Worship Expense |
| 7550 | 416 | Worship Supplies | E. Worship Expense |
| 7605 | 417-01 | Christian Ed - Sunday School | F. Education Expense |
| 7610 | 418 | Christian Ed - Adult | F. Education Expense |
| 7615 | 435 | Sunday Child Care | F. Education Expense |
| 7705 | 419 | Parish Life | G. Community Building Expense |
| 7715 | 420 | PR & Communication | G. Community Building Expense |
| 7720 | 440 | Conventions/Meetings | G. Community Building Expense |

### NSCC — Income Accounts

| code | legacy_code | name | category |
|------|-------------|------|----------|
| 301 | — | Tuition | A. Tuition & Fees |
| 302 | — | Registration Fees | A. Tuition & Fees |
| 303 | — | Extended Care | A. Tuition & Fees |
| 304 | — | Late Fees | A. Tuition & Fees |
| 305 | — | Investment Income | B. Other Income |
| 340 | — | Fundraising Income | B. Other Income |
| 350 | — | Gifts | B. Other Income |
| 355 | — | Grants Received | B. Other Income |

### NSCC — Expense Accounts

| code | legacy_code | name | category |
|------|-------------|------|----------|
| 424 | — | School Supplies | A. Instruction |
| 425 | — | Lunch/Snacks | A. Instruction |
| 433 | — | First Aid Expenses | A. Instruction |
| 439 | — | Educational Activities/Events | A. Instruction |
| 461 | — | Music/Spanish | A. Instruction |
| 410 | — | Maintenance | C. Infrastructure |
| 411 | — | Utilities | C. Infrastructure |
| 412 | — | Building Usage | C. Infrastructure |
| 413 | — | Copier Expenses | C. Infrastructure |
| 427 | — | Telephone/Data | C. Infrastructure |
| 428 | — | Cleaning & Other Supplies | C. Infrastructure |
| 443 | — | Cleaning Services | C. Infrastructure |
| 446 | — | Security/Fire | C. Infrastructure |
| 409 | — | Insurance | C. Infrastructure |
| 423 | — | Office Supplies & Expenses | D. Administration |
| 404 | — | Audit Fee | D. Administration |
| 407 | — | Management Fees | D. Administration |
| 426 | — | Payroll Fees | D. Administration |
| 442 | — | Computer Consultant | D. Administration |
| 444 | — | Credit Card Fees | D. Administration |
| 445 | — | PR/Communications | D. Administration |
| 447 | — | Licenses | D. Administration |
| 432 | — | Miscellaneous Expenses | E. Miscellaneous |
| 440 | — | Fundraising Expenses | E. Miscellaneous |

**Total: 12 CC income + 38 CC expense + 8 NSCC income + 24 NSCC expense = 82 accounts**

---

## Implementation Order

Each step is a discrete unit. Lint + typecheck after each step.

| Step | What | Files |
|------|------|-------|
| 1 | Install dependencies | `package.json` (date-fns, date-fns-tz if not present) |
| 2 | Seed accounts migration | `003_seed_accounts.sql` |
| 3 | Storage bucket migration | `004_storage_bucket.sql` |
| 4 | Generate + write vendor seed | `scripts/generate-vendor-seed.py` → `005_seed_vendors.sql` |
| 5 | Utility functions | `utils/currency.ts`, `utils/dates.ts` |
| 6 | Validators | `validators/requisition.ts` |
| 7 | DB query functions | `db/accounts.ts`, `db/vendors.ts`, `db/requisitions.ts`, `db/templates.ts`, `db/attachments.ts` |
| 8 | Server Actions | `actions/requisitions.ts`, `actions/templates.ts` |
| 9 | Status badge component | `components/requisitions/status-badge.tsx` |
| 10 | Searchable select component | `components/shared/searchable-select.tsx` |
| 11 | Camera hook + file upload | `hooks/use-camera.ts`, `components/shared/file-upload.tsx` |
| 12 | Requisition form | `components/requisitions/requisition-form.tsx` |
| 13 | New requisition page | `app/(app)/requisitions/new/page.tsx` |
| 14 | Requisition detail + timeline | `components/requisitions/requisition-detail.tsx`, `components/requisitions/requisition-timeline.tsx` |
| 15 | Requisition detail page | `app/(app)/requisitions/[id]/page.tsx` |
| 16 | Requisition list component | `components/requisitions/requisition-list.tsx` |
| 17 | Requisitions list page | `app/(app)/requisitions/page.tsx` |
| 18 | Template list component | `components/requisitions/template-list.tsx` |
| 19 | Templates page | `app/(app)/requisitions/templates/page.tsx` |
| 20 | Build verification | `npx tsc --noEmit && npx next build` |

---

## Acceptance Criteria

- [ ] Accounts seeded for both church (50 accounts) and NSCC (32 accounts) with real QBO numbers
- [ ] Vendors seeded: ~986 CC + ~1,009 NSCC (69 shared) from Bonnie's QBO exports
- [ ] Requisition form submits successfully with all required fields
- [ ] Entity selector filters account dropdown to correct entity
- [ ] Account dropdown is searchable and grouped by category
- [ ] Photo capture works via phone camera (capture="environment")
- [ ] Image compression runs client-side before upload (max 1920px, JPEG 0.8)
- [ ] Multiple file attachments supported (max 5MB each)
- [ ] File previews shown with remove option
- [ ] Vendor search auto-fills payee name and default account
- [ ] Form validates on blur with inline error messages
- [ ] Submit button shows loading state during submission
- [ ] On success: redirect to detail page with success banner
- [ ] Requisition detail shows all fields in read-only card layout
- [ ] Attached files displayed as tappable thumbnails
- [ ] Status badge shows correct icon + color + text
- [ ] Activity timeline shows chronological history from audit log
- [ ] Submitter can cancel own "submitted" requisition
- [ ] "My Requisitions" list shows correct requisitions per role
- [ ] List items show payee, amount (formatted), date, status badge
- [ ] Empty state shown when no requisitions exist
- [ ] "New Requisition" button prominent on list page
- [ ] Templates: save from form, list on templates page, pre-fill form from template
- [ ] Template edit and delete (with confirmation) work
- [ ] Template "Use Template" opens pre-filled form
- [ ] All touch targets ≥ 48px, primary buttons 56px
- [ ] All body text ≥ 18px, labels ≥ 16px
- [ ] All form inputs have visible labels (not placeholder-only)
- [ ] Every mutation writes to audit_log
- [ ] Money never uses JavaScript floating point
- [ ] TypeScript compiles with no errors
- [ ] Next.js build succeeds

---

## What This Sprint Does NOT Include

- Treasurer workflow (prepare, check number entry, mark paid) — Sprint 3
- Approval workflow (signer queue, approve/reject) — Sprint 4
- Push notifications — Sprint 4
- Email notifications on submission — Sprint 3
- Vendor CRUD UI (vendors are read-only from seed data in Sprint 2; no add/edit/delete UI)
- Member directory seeding — Sprint 5 (counter module). Data is in `docs/FromBonnie/ACS - Copy.csv` (83 members with giving numbers)
- Offline support — Sprint 8
- CSV/PDF export — Sprint 7
- Cash denomination counting for counter module — Sprint 5 (two modes: lump total OR bill/coin count; both counters must match)

---

## Dependencies / Blockers

- **Supabase Storage bucket** must exist. Migration 004 attempts to create it via SQL. If that doesn't work with hosted Supabase, create the `attachments` bucket manually in the Supabase dashboard.
- **Migrations 003 + 005 must be applied** to Supabase before testing account dropdowns and vendor search.
- **Sprint 1 must be complete** — auth, profiles, audit log, app shell all working. (Confirmed complete.)
- **Python 3 + openpyxl** needed on dev machine to run `scripts/generate-vendor-seed.py` (one-time use).
