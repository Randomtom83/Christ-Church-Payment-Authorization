-- Migration 008: Atomic approval helper function
-- Prevents race condition where two signers approve simultaneously
-- on a single-approval requisition

begin;

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
  v_req record;
  v_existing_count integer;
  v_already_acted boolean;
  v_threshold integer := 500;
  v_required integer;
  v_new_status text;
begin
  -- Lock the requisition row to prevent concurrent modifications
  select * into v_req
  from public.requisitions
  where id = p_requisition_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Requisition not found');
  end if;

  -- Check status
  if v_req.status != 'pending_approval' then
    return jsonb_build_object('success', false, 'error',
      'This requisition is no longer pending approval (status: ' || v_req.status || ')');
  end if;

  -- Check if signer is the submitter (conflict of interest)
  if v_req.submitted_by = p_signer_id then
    return jsonb_build_object('success', false, 'error',
      'You cannot approve a requisition you submitted');
  end if;

  -- Check if signer already acted on this requisition
  select exists(
    select 1 from public.approvals
    where requisition_id = p_requisition_id and signer_id = p_signer_id
  ) into v_already_acted;

  if v_already_acted then
    return jsonb_build_object('success', false, 'error',
      'You have already acted on this requisition');
  end if;

  -- Determine required approvals
  v_required := case when v_req.amount >= v_threshold then 2 else 1 end;

  -- Count existing approved approvals
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
      'success', true,
      'action', 'rejected',
      'new_status', 'rejected'
    );
  end if;

  -- Handle approval
  if p_action = 'approved' then
    -- Check if already fully approved
    if v_existing_count >= v_required then
      return jsonb_build_object('success', false, 'error',
        'This requisition is already fully approved');
    end if;

    -- Insert the approval
    insert into public.approvals (requisition_id, signer_id, action, notes)
    values (p_requisition_id, p_signer_id, 'approved', p_notes);

    -- Determine new status
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

-- Allow authenticated users to call this function
grant execute on function public.process_approval to authenticated;

-- Also create the increment template use count function referenced in Sprint 2
create or replace function public.increment_template_use_count(template_id uuid)
returns void
language sql
security definer
as $$
  update public.requisition_templates
  set use_count = use_count + 1,
      last_used_at = now()
  where id = template_id;
$$;

grant execute on function public.increment_template_use_count to authenticated;

commit;
