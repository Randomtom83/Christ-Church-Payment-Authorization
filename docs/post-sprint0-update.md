---
file: post-sprint0-update.md
project: Christ Church in Bloomfield & Glen Ridge — ChurchOps
date: 2026-04-16
---

# Post-Sprint 0 Update — Summary of Changes

Applied discoveries from conversations with Bonnie VanOrnum (Director of Finance) that affect project documentation and database schema.

---

## 1. CLAUDE.md Updates

- **1a. Proxy reference:** Added `src/proxy.ts` to file structure (Next.js 16 uses `proxy.ts` instead of `middleware.ts`). Updated `middleware.ts` comment to "Auth session refresh helper". Updated framework version from Next.js 15 to Next.js 16.
- **1b. ACS Realm note:** Added paragraph to Project Overview clarifying that ACS Realm is the system of record for contributions, not QuickBooks. Counter module feeds ACS via Bonnie's manual entry.
- **1c. Entity Context table:** Added "Contribution System" column. Church uses ACS Realm; NSCC is N/A. Updated "QB File" to "QBO (separate company)" for both entities.
- **1d. QuickBooks Integration section:** Added new subsection under Architecture Rules confirming QBO with separate companies, Intuit OAuth 2.0 + QBO API v3 for Sprint 7, expense-side only.
- **1e. Common Mistake #11:** Added: don't treat counter module as ACS replacement.
- **1f. Common Mistake #12:** Added: don't build against old account numbering. Use both `code` and `legacy_code` during transition.

## 2. Database Schema Updates

Created `supabase/migrations/002_schema_updates.sql`:

- **2a.** Added `legacy_code TEXT` to `accounts` table for chart of accounts renumbering transition (300-series → 4000-series).
- **2b.** Renamed `envelope_number` → `giving_number` in `members` table (matches ACS terminology). Added `email` and `phone` columns to match ACS export format. Updated index.
- **2c.** Added `contribution_system TEXT DEFAULT 'acs'` to `deposits` table.
- Also renamed `envelope_number` → `giving_number` in `deposit_items` for consistency.

**Note:** This migration has NOT been applied to Supabase yet. Run `npx supabase db push` or paste the SQL into the dashboard SQL editor.

## 3. Seed Data Files

Created `supabase/seed/`:

- **members.sql** — 3 test members with giving numbers for development.
- **README.md** — Documents that account seed data should NOT be created until Bonnie completes the chart of accounts renumbering. Explains the transition from 300-series to 4000-series numbering.

## 4. Workplan Updates (`docs/workplan.md`)

### Open Decisions (0.1)
- Decision 1 (QB Desktop/Online): **CLOSED** — QBO confirmed, separate companies.
- Decision 2 (Blue Foundry mobile deposit): **CLOSED** — Not pursuing.
- Decision 6 (NEW): ACS Realm role — **CLOSED** — ACS is system of record for contributions.
- Decision 7 (NEW): Chart of accounts renumbering — **IN PROGRESS**.

### Account Setup (0.2)
- Supabase project: ✅ DONE
- Twilio account: ✅ DONE
- Environment variables: IN PROGRESS

### Data Gathering (0.3)
- Chart of accounts (Church): ✅ RECEIVED (renumbering in progress)
- Chart of accounts (NSCC): ✅ RECEIVED
- Member/pledge list: ✅ RECEIVED (83 members from ACS)
- Church vendor list: ✅ RECEIVED
- NSCC vendor list: ✅ RECEIVED
- Added item 9: QBO plan level — OPEN

## 5. Technical Specification Updates (`docs/technical_specification.md`)

- **5a.** Updated Integration Layer table: QuickBooks row updated to "QBO confirmed, expense side only". Added ACS Realm row ("No direct integration — by design"). Removed QuickBooks Desktop row.
- **5b.** Added ACS/QBO note at top of Sprint 5 (Counter Entry Module) section clarifying the counter module produces records for manual entry, not direct system integration.

## 6. Verification

- `npm run lint` — ✅ clean
- `npm run typecheck` — ✅ clean
- Migration `002_schema_updates.sql` needs to be applied to Supabase separately
