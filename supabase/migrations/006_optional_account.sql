-- Migration 006: Make account_id optional on requisitions
-- Submitters may not know the account code; Bonnie (treasurer) fills it in
-- during the "prepare" step.

alter table public.requisitions
  alter column account_id drop not null;

comment on column public.requisitions.account_id is
  'Account code for this expense. May be NULL if submitter doesn''t know — treasurer fills in during preparation.';
