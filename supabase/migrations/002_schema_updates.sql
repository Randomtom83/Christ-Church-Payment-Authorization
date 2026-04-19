-- ============================================================================
-- Post-Sprint 0 schema updates
-- File: supabase/migrations/002_schema_updates.sql
-- Date: 2026-04-16
--
-- Changes based on discoveries from Director of Finance (Bonnie VanOrnum):
--   1. Add legacy_code to accounts (chart of accounts renumbering transition)
--   2. Rename envelope_number → giving_number in members (ACS terminology)
--   3. Add email + phone to members (ACS export format)
--   4. Add contribution_system to deposits (system of record tracking)
-- ============================================================================

-- 2a. Add legacy_code to accounts table
-- Old account number during chart of accounts renumbering transition.
-- e.g., legacy_code = "301" while code = "4005"
alter table public.accounts
  add column if not exists legacy_code text;

comment on column public.accounts.legacy_code is
  'Old account number during chart of accounts renumbering transition (300-series → 4000-series).';

-- 2b. Rename envelope_number → giving_number in members table
-- ACS Realm uses "Giving Number" not "envelope_number".
alter table public.members
  rename column envelope_number to giving_number;

-- Update the index to match the renamed column.
drop index if exists members_envelope_idx;
create index if not exists members_giving_number_idx on public.members(giving_number);

-- Add email and phone to members to match ACS export format.
alter table public.members
  add column if not exists email text,
  add column if not exists phone text;

-- 2c. Add contribution_system to deposits
-- System of record for contribution data. Currently always ACS Realm.
alter table public.deposits
  add column if not exists contribution_system text not null default 'acs';

comment on column public.deposits.contribution_system is
  'System of record for contribution data. Currently always ACS Realm.';

-- Also update deposit_items to use giving_number instead of envelope_number
-- for consistency with the members table rename.
alter table public.deposit_items
  rename column envelope_number to giving_number;
