-- Migration 007: Treasurer workflow columns and status updates
-- Adds columns for prepare, return, and payment tracking

begin;

-- Add new columns to requisitions
alter table public.requisitions
  add column if not exists returned_reason text,
  add column if not exists payment_date date,
  add column if not exists payment_reference text,
  add column if not exists prepared_notes text;

-- Update the status check constraint to include returned and cancelled
-- First drop the old constraint, then add the new one
do $$
begin
  -- Drop existing check constraint on status (name may vary)
  alter table public.requisitions drop constraint if exists requisitions_status_check;

  -- Also try the auto-generated name
  begin
    execute 'alter table public.requisitions drop constraint if exists requisitions_status_check1';
  exception when others then null;
  end;
end $$;

alter table public.requisitions
  add constraint requisitions_status_check
  check (status in (
    'submitted', 'returned', 'pending_approval',
    'approved', 'paid', 'recorded', 'rejected', 'cancelled'
  ));

-- Add comments
comment on column public.requisitions.returned_reason is
  'Reason provided by treasurer when returning a requisition to the submitter for corrections.';
comment on column public.requisitions.payment_date is
  'Date the payment was actually sent/made. Set by treasurer in Mark as Paid.';
comment on column public.requisitions.payment_reference is
  'Confirmation/reference number for online payments. Optional.';
comment on column public.requisitions.prepared_notes is
  'Internal notes from treasurer, visible to signers but not submitters.';

commit;
