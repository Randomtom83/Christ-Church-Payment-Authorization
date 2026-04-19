-- ============================================================================
-- ChurchOps initial schema
-- File: supabase/migrations/001_initial_schema.sql
-- Source: docs/technical_specification.md, Section 3
--
-- All money is DECIMAL(10,2). All timestamps are TIMESTAMPTZ in UTC.
-- Row-Level Security is the real authorization layer — never trust the client.
-- ============================================================================

-- Required for gen_random_uuid() (Supabase enables it by default, kept here
-- so the migration is portable).
create extension if not exists "pgcrypto";

-- ============================================================================
-- Reusable triggers
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================================
-- profiles — extension of auth.users
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  role text[] not null default array['submitter']::text[],
    -- valid values: submitter, treasurer, signer, counter, admin
  entity_access text[] not null default array['church','nscc']::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles using gin(role);
create index if not exists profiles_active_idx on public.profiles(is_active);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- accounts — chart of accounts (synced from QuickBooks or maintained manually)
-- ============================================================================
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  entity text not null check (entity in ('church','nscc')),
  category text not null,
  account_type text not null check (account_type in ('income','expense')),
  is_active boolean not null default true,
  display_order integer,
  created_at timestamptz not null default now()
);

create index if not exists accounts_entity_idx on public.accounts(entity);
create index if not exists accounts_active_idx on public.accounts(is_active);

-- ============================================================================
-- vendors — payees
-- ============================================================================
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  email text,
  default_account_id uuid references public.accounts(id) on delete set null,
  entity text check (entity is null or entity in ('church','nscc')),
  is_active boolean not null default true,
  qb_vendor_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendors_entity_idx on public.vendors(entity);
create index if not exists vendors_active_idx on public.vendors(is_active);

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

-- ============================================================================
-- requisition_templates — recurring expense shortcuts
-- ============================================================================
create table if not exists public.requisition_templates (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  vendor_id uuid references public.vendors(id) on delete set null,
  payee_name text not null,
  amount decimal(10,2),
  entity text not null check (entity in ('church','nscc')),
  account_id uuid not null references public.accounts(id),
  payment_method text not null check (payment_method in ('check','online')),
  description text,
  is_active boolean not null default true,
  last_used_at timestamptz,
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists requisition_templates_creator_idx
  on public.requisition_templates(created_by);
create index if not exists requisition_templates_active_idx
  on public.requisition_templates(is_active);

-- ============================================================================
-- requisitions — the core transaction record
-- ============================================================================
create table if not exists public.requisitions (
  id uuid primary key default gen_random_uuid(),
  req_number serial,
  template_id uuid references public.requisition_templates(id) on delete set null,

  submitted_by uuid not null references public.profiles(id),
  submitted_at timestamptz not null default now(),

  vendor_id uuid references public.vendors(id) on delete set null,
  payee_name text not null,
  amount decimal(10,2) not null check (amount > 0),
  entity text not null check (entity in ('church','nscc')),
  account_id uuid not null references public.accounts(id),
  payment_method text not null check (payment_method in ('check','online')),
  description text not null,
  check_number text,

  status text not null default 'submitted'
    check (status in ('submitted','prepared','pending_approval','approved','paid','recorded','rejected')),

  prepared_by uuid references public.profiles(id),
  prepared_at timestamptz,

  -- Canonical $500 dual-approval threshold (CLAUDE.md: NOT configurable).
  requires_dual_approval boolean generated always as (amount >= 500) stored,

  paid_at timestamptz,
  paid_by uuid references public.profiles(id),
  recorded_in_qb boolean not null default false,
  qb_transaction_id text,

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requisitions_status_idx on public.requisitions(status);
create index if not exists requisitions_submitter_idx on public.requisitions(submitted_by);
create index if not exists requisitions_entity_idx on public.requisitions(entity);
create index if not exists requisitions_submitted_at_idx
  on public.requisitions(submitted_at desc);

drop trigger if exists requisitions_set_updated_at on public.requisitions;
create trigger requisitions_set_updated_at
  before update on public.requisitions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- approvals — one row per signer action
-- ============================================================================
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid not null references public.requisitions(id) on delete cascade,
  signer_id uuid not null references public.profiles(id),
  action text not null check (action in ('approved','rejected')),
  notes text,
  signed_at timestamptz not null default now(),
  -- A single signer can only sign a given requisition once.
  unique (requisition_id, signer_id)
);

create index if not exists approvals_requisition_idx on public.approvals(requisition_id);
create index if not exists approvals_signer_idx on public.approvals(signer_id);

-- ============================================================================
-- attachments — receipts, invoices, check images (in Supabase Storage)
-- ============================================================================
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid references public.requisitions(id) on delete cascade,
  deposit_id uuid,    -- FK added below once deposits exists
  file_path text not null,
  file_name text not null,
  file_type text not null check (file_type in ('receipt','invoice','check_image','other')),
  file_size integer,
  uploaded_by uuid not null references public.profiles(id),
  uploaded_at timestamptz not null default now(),
  -- Each attachment must belong to exactly one parent.
  check (
    (requisition_id is not null and deposit_id is null)
    or (requisition_id is null and deposit_id is not null)
  )
);

create index if not exists attachments_requisition_idx on public.attachments(requisition_id);
create index if not exists attachments_deposit_idx on public.attachments(deposit_id);

-- ============================================================================
-- deposits — one per Sunday counting session
-- ============================================================================
create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  deposit_date date not null default current_date,

  counter_1_id uuid not null references public.profiles(id),
  counter_2_id uuid references public.profiles(id),

  total_checks decimal(10,2) not null default 0,
  total_cash decimal(10,2) not null default 0,
  total_amount decimal(10,2) not null default 0,

  status text not null default 'in_progress'
    check (status in ('in_progress','pending_verification','verified','recorded')),
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),

  recorded_in_qb boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deposits_status_idx on public.deposits(status);
create index if not exists deposits_date_idx on public.deposits(deposit_date desc);

drop trigger if exists deposits_set_updated_at on public.deposits;
create trigger deposits_set_updated_at
  before update on public.deposits
  for each row execute function public.set_updated_at();

-- Now that deposits exists, attach the FK from attachments.deposit_id.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'attachments_deposit_id_fkey'
  ) then
    alter table public.attachments
      add constraint attachments_deposit_id_fkey
      foreign key (deposit_id) references public.deposits(id) on delete cascade;
  end if;
end $$;

-- ============================================================================
-- deposit_items — individual contributions within a deposit
-- ============================================================================
create table if not exists public.deposit_items (
  id uuid primary key default gen_random_uuid(),
  deposit_id uuid not null references public.deposits(id) on delete cascade,

  item_type text not null check (item_type in ('check','cash','coin')),
  amount decimal(10,2) not null check (amount > 0),
  account_id uuid not null references public.accounts(id),

  is_pledge_payment boolean not null default false,
  member_name text,
  envelope_number text,

  check_number text,
  check_image_path text,

  notes text,
  created_at timestamptz not null default now()
);

create index if not exists deposit_items_deposit_idx on public.deposit_items(deposit_id);

-- ============================================================================
-- audit_log — every state change writes here. No exceptions. (CLAUDE.md)
-- ============================================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_entity_idx
  on public.audit_log(entity_type, entity_id);
create index if not exists audit_log_user_idx on public.audit_log(user_id);
create index if not exists audit_log_created_idx on public.audit_log(created_at desc);

-- ============================================================================
-- members — directory used for pledge attribution at counting time
-- ============================================================================
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  envelope_number text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists members_envelope_idx on public.members(envelope_number);
create index if not exists members_active_idx on public.members(is_active);

-- ============================================================================
-- Helper: does the current user have a given role?
-- SECURITY DEFINER so RLS policies can call it without recursing into profiles.
-- ============================================================================
create or replace function public.current_user_has_role(target_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and target_role = any(role)
      and is_active = true
  );
$$;

-- ============================================================================
-- Row-Level Security
-- Source: docs/technical_specification.md, Section 3 "Row-Level Security Policies"
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.vendors enable row level security;
alter table public.requisition_templates enable row level security;
alter table public.requisitions enable row level security;
alter table public.approvals enable row level security;
alter table public.attachments enable row level security;
alter table public.deposits enable row level security;
alter table public.deposit_items enable row level security;
alter table public.audit_log enable row level security;
alter table public.members enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
  for select using (public.current_user_has_role('admin'));

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles admin all" on public.profiles
  for all using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

-- ---------- accounts (read-only for everyone authenticated; admin/treasurer write) ----------
drop policy if exists "accounts read all authenticated" on public.accounts;
create policy "accounts read all authenticated" on public.accounts
  for select using (auth.uid() is not null);

drop policy if exists "accounts admin or treasurer write" on public.accounts;
create policy "accounts admin or treasurer write" on public.accounts
  for all using (
    public.current_user_has_role('admin')
    or public.current_user_has_role('treasurer')
  )
  with check (
    public.current_user_has_role('admin')
    or public.current_user_has_role('treasurer')
  );

-- ---------- vendors (read-all-authenticated; admin/treasurer write) ----------
drop policy if exists "vendors read all authenticated" on public.vendors;
create policy "vendors read all authenticated" on public.vendors
  for select using (auth.uid() is not null);

drop policy if exists "vendors admin or treasurer write" on public.vendors;
create policy "vendors admin or treasurer write" on public.vendors
  for all using (
    public.current_user_has_role('admin')
    or public.current_user_has_role('treasurer')
  )
  with check (
    public.current_user_has_role('admin')
    or public.current_user_has_role('treasurer')
  );

-- ---------- requisition_templates (creator owns; treasurer/admin see all) ----------
drop policy if exists "templates owner read" on public.requisition_templates;
create policy "templates owner read" on public.requisition_templates
  for select using (created_by = auth.uid());

drop policy if exists "templates owner write" on public.requisition_templates;
create policy "templates owner write" on public.requisition_templates
  for all using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "templates treasurer read" on public.requisition_templates;
create policy "templates treasurer read" on public.requisition_templates
  for select using (
    public.current_user_has_role('treasurer')
    or public.current_user_has_role('admin')
  );

-- ---------- requisitions ----------
drop policy if exists "requisitions submitter read" on public.requisitions;
create policy "requisitions submitter read" on public.requisitions
  for select using (submitted_by = auth.uid());

drop policy if exists "requisitions submitter insert" on public.requisitions;
create policy "requisitions submitter insert" on public.requisitions
  for insert with check (submitted_by = auth.uid());

drop policy if exists "requisitions signer read pending" on public.requisitions;
create policy "requisitions signer read pending" on public.requisitions
  for select using (
    status in ('prepared','pending_approval','approved')
    and public.current_user_has_role('signer')
  );

drop policy if exists "requisitions treasurer all" on public.requisitions;
create policy "requisitions treasurer all" on public.requisitions
  for all using (public.current_user_has_role('treasurer'))
  with check (public.current_user_has_role('treasurer'));

drop policy if exists "requisitions admin all" on public.requisitions;
create policy "requisitions admin all" on public.requisitions
  for all using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

-- ---------- approvals ----------
drop policy if exists "approvals signer insert" on public.approvals;
create policy "approvals signer insert" on public.approvals
  for insert with check (
    signer_id = auth.uid()
    and public.current_user_has_role('signer')
  );

drop policy if exists "approvals signer read" on public.approvals;
create policy "approvals signer read" on public.approvals
  for select using (
    public.current_user_has_role('signer')
    or public.current_user_has_role('treasurer')
    or public.current_user_has_role('admin')
  );

drop policy if exists "approvals submitter read own" on public.approvals;
create policy "approvals submitter read own" on public.approvals
  for select using (
    exists (
      select 1 from public.requisitions r
      where r.id = approvals.requisition_id
        and r.submitted_by = auth.uid()
    )
  );

-- ---------- attachments (mirror parent permissions via existence checks) ----------
drop policy if exists "attachments uploader read" on public.attachments;
create policy "attachments uploader read" on public.attachments
  for select using (uploaded_by = auth.uid());

drop policy if exists "attachments uploader insert" on public.attachments;
create policy "attachments uploader insert" on public.attachments
  for insert with check (uploaded_by = auth.uid());

drop policy if exists "attachments staff read" on public.attachments;
create policy "attachments staff read" on public.attachments
  for select using (
    public.current_user_has_role('treasurer')
    or public.current_user_has_role('signer')
    or public.current_user_has_role('admin')
  );

-- ---------- deposits ----------
drop policy if exists "deposits counter all" on public.deposits;
create policy "deposits counter all" on public.deposits
  for all using (public.current_user_has_role('counter'))
  with check (public.current_user_has_role('counter'));

drop policy if exists "deposits treasurer read" on public.deposits;
create policy "deposits treasurer read" on public.deposits
  for select using (
    public.current_user_has_role('treasurer')
    or public.current_user_has_role('admin')
  );

drop policy if exists "deposits admin all" on public.deposits;
create policy "deposits admin all" on public.deposits
  for all using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

-- ---------- deposit_items ----------
drop policy if exists "deposit_items counter all" on public.deposit_items;
create policy "deposit_items counter all" on public.deposit_items
  for all using (public.current_user_has_role('counter'))
  with check (public.current_user_has_role('counter'));

drop policy if exists "deposit_items treasurer read" on public.deposit_items;
create policy "deposit_items treasurer read" on public.deposit_items
  for select using (
    public.current_user_has_role('treasurer')
    or public.current_user_has_role('admin')
  );

-- ---------- audit_log (insert allowed for any authenticated user; read admin-only) ----------
drop policy if exists "audit insert authenticated" on public.audit_log;
create policy "audit insert authenticated" on public.audit_log
  for insert with check (auth.uid() is not null);

drop policy if exists "audit admin read" on public.audit_log;
create policy "audit admin read" on public.audit_log
  for select using (public.current_user_has_role('admin'));

-- ---------- members ----------
drop policy if exists "members read counter+treasurer+admin" on public.members;
create policy "members read counter+treasurer+admin" on public.members
  for select using (
    public.current_user_has_role('counter')
    or public.current_user_has_role('treasurer')
    or public.current_user_has_role('admin')
  );

drop policy if exists "members admin write" on public.members;
create policy "members admin write" on public.members
  for all using (
    public.current_user_has_role('admin')
    or public.current_user_has_role('treasurer')
  )
  with check (
    public.current_user_has_role('admin')
    or public.current_user_has_role('treasurer')
  );

-- ============================================================================
-- Auto-provision a profiles row when a new auth.users row is created.
-- Default role = ['submitter']; admin can elevate later via the admin panel.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, new.phone, 'New User'), '@', 1)
    ),
    new.email,
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
