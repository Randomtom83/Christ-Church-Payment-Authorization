-- Migration 009: Counter module schema updates
-- Add missing fund category income accounts and deposit_items enhancements

begin;

-- Add missing income accounts for fund categories used by counters
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('4070', null, 'Building Fund',       'church', 'A. Parish Generated Income', 'income', true, 220),
  ('4075', null, 'Support Our School',  'church', 'A. Parish Generated Income', 'income', true, 230),
  ('4080', null, 'Music Fund',          'church', 'A. Parish Generated Income', 'income', true, 240),
  ('4085', null, 'Animal Ministry',     'church', 'A. Parish Generated Income', 'income', true, 250),
  ('4090-f', null, 'Food Ministry',     'church', 'A. Parish Generated Income', 'income', true, 260),
  ('4042', null, 'Easter Lilies',       'church', 'A. Parish Generated Income', 'income', true, 155)
on conflict (code) do nothing;

-- Add denomination_counts JSONB column for cash denomination breakdown
alter table public.deposit_items
  add column if not exists denomination_counts jsonb,
  add column if not exists category_label text;

-- Make account_id nullable on deposit_items (counters select by category name, Bonnie maps to accounts)
alter table public.deposit_items
  alter column account_id drop not null;

-- Add rejection_notes to deposits for when Counter 2 rejects verification
alter table public.deposits
  add column if not exists rejection_notes text;

-- Update deposit_items item_type check to include 'special'
alter table public.deposit_items drop constraint if exists deposit_items_item_type_check;
alter table public.deposit_items
  add constraint deposit_items_item_type_check
  check (item_type in ('check', 'cash', 'coin', 'special'));

-- Comments
comment on column public.deposit_items.denomination_counts is
  'JSON object with bill/coin counts for cash items: {"hundreds":2,"twenties":15,...}';
comment on column public.deposit_items.category_label is
  'Human-readable fund category name (e.g. "Pledge Payment", "Plate Offering")';
comment on column public.deposits.rejection_notes is
  'Notes from Counter 2 when verification is rejected — what doesn''t match';

commit;
