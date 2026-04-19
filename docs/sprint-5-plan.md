---
file: sprint-5-plan.md
project: Christ Church in Bloomfield & Glen Ridge — ChurchOps
sprint: 5 (Counter Entry Module)
date: 2026-04-18
---

# Sprint 5 Plan — Counter Entry Module

## Scope

Build the Sunday counter entry interface: check photography and recording, cash denomination calculator, member search for pledge attribution, running totals, second counter verification, deposit history. Seed the full 83-member list from ACS. Add offline support with local storage queue and automatic sync.

**This module does NOT replace ACS Realm.** It replaces the paper counting forms. Output is a digital record Bonnie uses for manual ACS and QBO entry.

---

## Fund Categories

The counter UI uses a friendly category dropdown. Each category maps to a church income account (already seeded in migration 003). Missing fund categories need new income accounts.

| Counter Category | Maps To Account | Code | Status |
|-----------------|----------------|------|--------|
| Pledge Payment | Pledges - Current Year | 4010 | EXISTS |
| Plate Offering | Plate | 4005 | EXISTS |
| Christmas | Christmas | 4025 | EXISTS |
| Easter | Easter | 4030 | EXISTS |
| Thanksgiving | Thanksgiving | 4035 | EXISTS |
| Altar Flowers | Flower Donations | 4040 | EXISTS |
| Memorial Offering | Memorial Offerings | 4055 | EXISTS |
| Outreach | Outreach Contributions | 4065 | EXISTS |
| Other Contributions | Other Contributions | 4050 | EXISTS |
| Building Fund | — | NEW | NEED TO ADD |
| Support Our School | — | NEW | NEED TO ADD |
| Music Fund | — | NEW | NEED TO ADD |
| Animal Ministry | — | NEW | NEED TO ADD |
| Food Ministry | — | NEW | NEED TO ADD |
| Easter Lilies | — | NEW | NEED TO ADD |

Migration 009 adds the missing income accounts.

---

## File Inventory

### New Files (24)

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase/migrations/009_counter_module.sql` | Add missing income accounts for fund categories (Building Fund, Support Our School, Music Fund, Animal Ministry, Food Ministry, Easter Lilies). Add `denomination_counts JSONB` column to deposit_items for cash denomination data. Add `category_label TEXT` column to deposit_items for human-readable category name (complements account_id). Update deposit_items to make `account_id` nullable for flexibility. Add `rejection_notes TEXT` column to deposits for when Counter 2 rejects verification. |
| 2 | `supabase/migrations/010_seed_members.sql` | Seed all 83 members from ACS CSV export (`docs/FromBonnie/ACS - Copy.csv`). Full_name, giving_number, address, email, phone, is_active. Generated from CSV data. Replaces the 3-member test seed. |
| 3 | `scripts/generate-member-seed.py` | One-time script: reads ACS CSV, generates `010_seed_members.sql`. |
| 4 | `src/lib/db/deposits.ts` | DB functions: `getById(id)` with items + counter profiles, `getByDate(date)` for resume-or-create logic, `getAll()` for history, `getByCounter(userId)` for counter's own deposits, `create(data)`, `updateStatus(id, status)`, `updateTotals(id, totals)`, `updateVerification(id, counter2Id)`, `rejectVerification(id, notes)`. |
| 5 | `src/lib/db/deposit-items.ts` | DB functions: `getByDeposit(depositId)`, `create(data)`, `update(id, data)`, `remove(id)`, `getTotalsByCategory(depositId)` — aggregates amounts grouped by category. |
| 6 | `src/lib/db/members.ts` | DB functions: `search(query)` — partial name match, case insensitive, limit 20. `getAll()`. `getByGivingNumber(num)`. |
| 7 | `src/lib/validators/deposit.ts` | Zod schemas: `checkItemSchema` (amount, category, member_name optional, check_number optional), `cashItemSchema` (denomination_counts object, category, total), `specialItemSchema` (description, amount, category), `verificationSchema` (confirmation boolean), `rejectionSchema` (notes required). |
| 8 | `src/lib/actions/deposits.ts` | Server Actions: `createOrResumeDeposit()` — finds today's in_progress deposit or creates new one. `submitForVerification(id)` — validates, sets status, locks editing. `verifyDeposit(id)` — Counter 2 confirms, sets status to verified, notifies treasurer. `rejectVerification(id, formData)` — returns to in_progress with notes, notifies Counter 1. |
| 9 | `src/lib/actions/deposit-items.ts` | Server Actions: `addCheckItem(depositId, formData)` — validates, creates item, uploads check image to Storage. `addCashItem(depositId, formData)` — validates denomination counts, calculates total, creates item. `addSpecialItem(depositId, formData)` — creates miscellaneous item. `updateItem(id, formData)`. `deleteItem(id)`. All recalculate deposit totals after changes. |
| 10 | `src/lib/constants/fund-categories.ts` | Export `FUND_CATEGORIES` array with label, value, and account_code for each counter category. Used by the category dropdown. Maps friendly names to account codes. |
| 11 | `src/components/deposits/counter-entry.tsx` | Main counter entry client component. Single scrollable page with three sections (Checks, Cash, Special). Sticky running totals bar at top. Auto-saves to localStorage on every change. Syncs to Supabase when online. "Review Deposit" button at bottom. |
| 12 | `src/components/deposits/check-entry.tsx` | Client component: "Add Check" form. Camera button for check photo, amount input, category dropdown, member search (when pledge selected), check number. Inline form that appears below the check list when "Add Check" is tapped. |
| 13 | `src/components/deposits/cash-calculator.tsx` | Client component: denomination rows with +/- stepper buttons. $100 through pennies. Live subtotal per row. Cash total at bottom. Integer cents math only. Category dropdown (default: Plate Offering). "Add Another Cash Category" button for splits. |
| 14 | `src/components/deposits/special-entry.tsx` | Client component: simple form for special/designated offerings. Description, amount, category. Less prominent than checks and cash. |
| 15 | `src/components/deposits/running-totals.tsx` | Client component: sticky bar showing Total Checks, Total Cash, Grand Total. 24px bold for grand total. Updates live via props. |
| 16 | `src/components/deposits/check-list.tsx` | Client component: list of entered checks. Each shows amount, category, member name, check image thumbnail. Edit and delete buttons. |
| 17 | `src/components/deposits/member-search.tsx` | Client component: searchable member dropdown. Shows "[Name] — #[Giving Number]". "Not in list" option for free text entry. Pre-loads member list to localStorage for offline use. |
| 18 | `src/components/deposits/deposit-summary.tsx` | Client component: summary view showing date, counter name, check/cash/grand totals, breakdown by fund category, check list with thumbnails. Used for both Counter 1 review and Counter 2 verification. |
| 19 | `src/components/deposits/verification-actions.tsx` | Client component: Counter 2's action buttons. "I Verify This Deposit" (green, 56px) with confirmation. "Totals Don't Match" (secondary) with required notes. |
| 20 | `src/components/deposits/deposit-list.tsx` | Client component: list of deposits for history page. Date, total, status badge, counter names. Tap to view detail. |
| 21 | `src/components/deposits/deposit-slip-info.tsx` | Component: clean display of deposit totals for bank slip. Total checks (count + amount), total cash, total deposit, coin total. "Copy to Clipboard" button. |
| 22 | `src/components/deposits/offline-indicator.tsx` | Client component: shows online/offline status. When offline: "Working offline — data saved locally". When items are queued: "2 images waiting to upload". Auto-syncs when reconnected. |
| 23 | `src/hooks/use-offline-sync.ts` | Custom hook: manages localStorage queue for offline entries. Detects online/offline via `navigator.onLine` + event listeners. Syncs queued items (including check images) when connection returns. Returns `{ isOnline, queuedCount, syncStatus }`. |
| 24 | `src/app/(app)/deposits/[id]/page.tsx` | **REPLACE** placeholder. Server component: fetches deposit with items, renders summary. For Counter 2: shows verification actions if status is pending_verification. For treasurer: read-only view with check images. |

### Modified Files (5)

| # | File | Changes |
|---|------|---------|
| 1 | `src/app/(app)/deposits/page.tsx` | Replace placeholder. List of deposits. Counter sees their own, treasurer/admin see all. Link to start new deposit. |
| 2 | `src/app/(app)/deposits/new/page.tsx` | Replace placeholder. Calls createOrResumeDeposit, redirects to the entry page. |
| 3 | `src/lib/constants.ts` | Add DEPOSIT_CATEGORIES with fund category definitions. |
| 4 | `src/lib/actions/notifications.ts` | Add `notifyTreasurerDepositVerified(deposit)` and `notifyCounterVerificationRejected(deposit, notes)`. |
| 5 | `src/components/requisitions/status-badge.tsx` | Extend to handle deposit statuses (in_progress, pending_verification, verified, recorded). Rename to a more generic `status-badge.tsx` or add deposit variants. |

---

## Architecture Decisions

### 1. Check Image Upload Strategy

**Online:** Check images upload immediately to Supabase Storage at `deposits/{deposit_id}/checks/{timestamp}-{filename}`. The deposit_item record stores `check_image_path` pointing to the storage file. Bonnie can view all check images from her computer.

**Offline:** Check images are captured and stored in the browser's IndexedDB (via the offline sync hook). The deposit_item is created in localStorage with a placeholder `check_image_path = "pending-upload"`. When connection returns, the sync hook uploads each queued image and updates the deposit_item record with the real storage path.

**Indicator:** The `offline-indicator` component shows "X images waiting to upload" when items are queued. It auto-syncs with a retry loop when `navigator.onLine` flips to true.

### 2. Cash Denomination Calculator

All math uses integer cents. Each denomination row stores a count, and the total is computed as:
```
total_cents = (hundreds * 10000) + (fifties * 5000) + ... + (pennies * 1)
```

The denominations are stored in a JSONB column `denomination_counts` on the deposit_item row:
```json
{
  "hundreds": 2, "fifties": 0, "twenties": 15,
  "tens": 3, "fives": 8, "ones": 12,
  "quarters": 20, "dimes": 15, "nickels": 10, "pennies": 25
}
```

This lets Bonnie see exactly what was counted, not just a total.

### 3. Auto-Save Strategy

Every field change triggers a debounced save to localStorage:
- Key: `deposit-{deposit_id}-items` for the items array
- Key: `deposit-{deposit_id}-cash` for the cash denomination state
- On page load, check localStorage first. If data exists and is newer than the server data, use local. Otherwise, use server.
- This prevents data loss if the browser crashes, the phone dies, or they accidentally navigate away.

Server saves happen on explicit actions:
- "Add Check" button → server action → creates deposit_item
- Cash denomination changes → debounced server sync (every 5 seconds of inactivity)
- This means the server always has a recent copy, but localStorage is the real-time scratch pad.

### 4. Member Search Offline

On first load of the counter entry screen, fetch all members and cache in localStorage:
- Key: `members-cache`
- TTL: 24 hours (re-fetch if older)
- The member list is only 83 records — small enough to cache entirely
- Search is done client-side against the cached list
- This works even in airplane mode

### 5. Single-Page Entry vs. Wizard

The entry screen is ONE scrollable page with three sections, not a multi-step wizard. Counters need to jump back and forth:
- Start entering checks, realize they missed a cash count, scroll up
- Enter cash, remember a loose check, scroll down to add it
- A wizard would force them through steps linearly, which doesn't match the paper process

The sticky running totals bar at the top always shows where they are.

### 6. Resume-or-Create Logic

When a counter hits "Start Counting":
1. Query for today's deposit with status `in_progress` and `counter_1_id = current user`
2. If found → navigate to that deposit's entry screen (resume)
3. If not found → create a new deposit, navigate to entry screen
4. This prevents duplicate deposit sessions

### 7. Deposit Status Flow

```
in_progress (Counter 1 entering)
  ↓ "Submit for Verification"
pending_verification (locked, waiting for Counter 2)
  ├─ Counter 2: "I Verify" → verified (complete)
  └─ Counter 2: "Doesn't Match" → in_progress (Counter 1 can edit)
```

---

## Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | Generate + run member seed | `scripts/generate-member-seed.py` → `010_seed_members.sql` |
| 2 | Migration 009: counter module schema | `009_counter_module.sql` |
| 3 | Fund categories constant | `constants/fund-categories.ts`, update `constants.ts` |
| 4 | DB functions | `db/deposits.ts`, `db/deposit-items.ts`, `db/members.ts` |
| 5 | Validators | `validators/deposit.ts` |
| 6 | Server Actions (deposits) | `actions/deposits.ts` |
| 7 | Server Actions (deposit items) | `actions/deposit-items.ts` |
| 8 | Notifications | Update `actions/notifications.ts` |
| 9 | Offline sync hook | `hooks/use-offline-sync.ts` |
| 10 | Member search component | `deposits/member-search.tsx` |
| 11 | Running totals bar | `deposits/running-totals.tsx` |
| 12 | Check entry + check list | `deposits/check-entry.tsx`, `deposits/check-list.tsx` |
| 13 | Cash calculator | `deposits/cash-calculator.tsx` |
| 14 | Special entry | `deposits/special-entry.tsx` |
| 15 | Main counter entry | `deposits/counter-entry.tsx` |
| 16 | Offline indicator | `deposits/offline-indicator.tsx` |
| 17 | Deposit summary | `deposits/deposit-summary.tsx` |
| 18 | Deposit slip info | `deposits/deposit-slip-info.tsx` |
| 19 | Verification actions | `deposits/verification-actions.tsx` |
| 20 | Deposit list | `deposits/deposit-list.tsx` |
| 21 | Update status badge for deposits | `status-badge.tsx` |
| 22 | New deposit page | `deposits/new/page.tsx` |
| 23 | Deposit detail page | `deposits/[id]/page.tsx` |
| 24 | Deposit history page | `deposits/page.tsx` |
| 25 | Build verification + deploy | `npx tsc --noEmit && npx next build && git push` |

---

## Acceptance Criteria

- [ ] Counter can start a new deposit session or resume today's in-progress session
- [ ] Running totals bar is sticky and shows checks/cash/grand total, updating live
- [ ] Check entry: camera capture, amount, category dropdown, member search (pledge), check number
- [ ] Check images upload immediately to Supabase Storage (online) or queue (offline)
- [ ] Check images viewable by Bonnie on deposit detail page
- [ ] Member search works offline (cached in localStorage)
- [ ] Member search shows "[Name] — #[Giving Number]", supports "Not in list" option
- [ ] Cash calculator: denomination rows with +/- steppers, live subtotals, integer cents math
- [ ] Cash category defaults to Plate Offering, supports splitting across categories
- [ ] Special items: description, amount, category
- [ ] Auto-save to localStorage on every change
- [ ] "Review Deposit" shows full summary with category breakdown
- [ ] "Submit for Verification" locks editing, sets pending_verification
- [ ] Counter 2 can view summary and verify or reject
- [ ] Verification notifies treasurer
- [ ] Rejection unlocks for Counter 1 with notes
- [ ] Deposit slip info shows bank slip totals with "Copy to Clipboard"
- [ ] Deposit history list with date, amount, status badge, counter names
- [ ] Offline indicator shows status and queued items count
- [ ] Auto-sync when connection returns
- [ ] 83 members seeded from ACS export
- [ ] Fund category accounts seeded (Building Fund, etc.)
- [ ] All stepper buttons >= 44px, all primary buttons 56px
- [ ] All body text >= 18px, totals 24px
- [ ] All state changes write to audit_log
- [ ] TypeScript compiles, Next.js builds

---

## What This Sprint Does NOT Include

- Real-time dashboard updates for deposit totals — Sprint 6
- Direct ACS integration — by design, never
- Direct QBO integration for deposits — Sprint 7
- PDF export of deposit summary — Sprint 7
- Coin wrapper counting (just loose coins) — could add in Sprint 8
- Multiple deposits per day — one deposit per day is the standard

---

## Dependencies / Blockers

- **Migrations 009 + 010 must be applied** to Supabase.
- **Sprint 4 must be complete** (confirmed).
- **Supabase Storage bucket "attachments"** must exist (created in Sprint 2, confirmed).
- **At least one user with counter role** must exist for testing.
- **Member data** from `docs/FromBonnie/ACS - Copy.csv` (83 members, confirmed available).
