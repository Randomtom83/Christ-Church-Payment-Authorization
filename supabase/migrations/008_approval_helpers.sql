-- Migration 008: Atomic approval helper function
-- Prevents race condition where two signers approve simultaneously
-- on a single-approval requisition
-- NOTE: Run in Supabase SQL Editor (not RLS tester)

create or replace function public.process_approval(
  p_requisition_id uuid,
  p_signer_id uuid,
  p_action text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_status text;
  v_submitted_by uuid;
  v_amount decimal;
  v_existing_count integer;
  v_already_acted boolean;
  v_required integer;
  v_new_status text;
begin
  -- Lock the requisition row and read key fields
  select status, submitted_by, amount
  into v_status, v_submitted_by, v_amount
  from public.requisitions
  where id = p_requisition_id
  for update;

  if v_status is null then
    return jsonb_build_object('success', false, 'error', 'Requisition not found');
  end if;

  if v_status != 'pending_approval' then
    return jsonb_build_object('success', false, 'error',
      'This requisition is no longer pending approval (status: ' || v_status || ')');
  end if;

  if v_submitted_by = p_signer_id then
    return jsonb_build_object('success', false, 'error',
      'You cannot approve a requisition you submitted');
  end if;

  select exists(
    select 1 from public.approvals
    where requisition_id = p_requisition_id and signer_id = p_signer_id
  ) into v_already_acted;

  if v_already_acted then
    return jsonb_build_object('success', false, 'error',
      'You have already acted on this requisition');
  end if;

  v_required := case when v_amount >= 500 then 2 else 1 end;

  select count(*) into v_existing_count
  from public.approvals
  where requisition_id = p_requisition_id and action = 'approved';

  -- Handle rejection
  if p_action = 'rejected' then
    insert into public.approvals (requisition_id, signer_id, action, notes)
    values (p_requisition_id, p_signer_id, 'rejected', p_notes);

    update public.requisitions
    set status = 'rejected', updated_at = now()
    where id = p_requisition_id;

    return jsonb_build_object(
      'success', true, 'action', 'rejected', 'new_status', 'rejected'
    );
  end if;

  -- Handle approval
  if p_action = 'approved' then
    if v_existing_count >= v_required then
      return jsonb_build_object('success', false, 'error',
        'This requisition is already fully approved');
    end if;

    insert into public.approvals (requisition_id, signer_id, action, notes)
    values (p_requisition_id, p_signer_id, 'approved', p_notes);

    if v_existing_count + 1 >= v_required then
      v_new_status := 'approved';
      update public.requisitions
      set status = 'approved', updated_at = now()
      where id = p_requisition_id;
    else
      v_new_status := 'pending_approval';
    end if;

    return jsonb_build_object(
      'success', true,
      'action', 'approved',
      'new_status', v_new_status,
      'approvals_count', v_existing_count + 1,
      'approvals_required', v_required
    );
  end if;

  return jsonb_build_object('success', false, 'error', 'Invalid action');
end;
$$;

grant execute on function public.process_approval to authenticated;

-- Also create the increment template use count function referenced in Sprint 2
create or replace function public.increment_template_use_count(template_id uuid)
returns void
language sql
security definer
as $$
  update public.requisition_templates
  set use_count = use_count + 1, last_used_at = now()
  where id = template_id;
$$;

grant execute on function public.increment_template_use_count to authenticated;
