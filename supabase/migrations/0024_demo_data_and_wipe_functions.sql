-- Hotel Kamala Inn Grand — Demo-data restore & atomic ledger wipe
-- Blueprint 4.7: the reservations ledger supports "restoring sample
-- demonstration data for training purposes and a full, deliberate database
-- wipe for testing environments, performed as a single atomic operation so
-- it cannot leave the dataset in a half-cleared state."
--
-- Both are SECURITY DEFINER Postgres functions invoked via supabase.rpc(),
-- with the master_admin check enforced INSIDE the function body — the UI's
-- render gate is convenience, this is the real gate, so a direct RPC call
-- from any lesser role fails identically. Each plpgsql function body runs
-- in a single transaction, which is what makes the wipe genuinely atomic.
--
-- The wipe clears reservations AND enquiries (both are booking data a
-- testing environment needs reset) but never audit_logs — Section 11.3
-- treats the audit trail as permanent, and each of these functions writes
-- its own audit entry as part of the same transaction.
--
-- The wipe additionally requires a literal confirmation phrase as an
-- argument, checked server-side — so the typed-confirmation UI cannot be
-- bypassed by calling the RPC directly.

alter table audit_logs drop constraint audit_logs_action_type_check;

alter table audit_logs add constraint audit_logs_action_type_check
  check (action_type in (
    'create_booking',
    'edit_ledger',
    'check_in',
    'check_out',
    'cancel_booking',
    'restore_booking',
    'update_rates',
    'update_availability',
    'create_staff',
    'revoke_staff',
    'create_category',
    'edit_category',
    'archive_category',
    'restore_category',
    'create_room',
    'delete_room',
    'reassign_room_category',
    'update_branding',
    'update_booking_rules',
    'update_invoice_config',
    'update_site_content',
    'toggle_maintenance_mode',
    'upload_asset',
    'upload_gallery_image',
    'archive_gallery_image',
    'restore_gallery_image',
    'delete_gallery_image',
    'update_gallery_image_folder',
    'restore_demo_data',
    'wipe_reservations'
  ));

-- ---------------------------------------------------------------------------
-- restore_demo_reservations()
-- Inserts six clearly-marked demo bookings against whatever physical rooms
-- currently exist (picked dynamically so the function survives room
-- renumbering), with dates relative to today so the dashboard, room map, and
-- calendar all look alive during training. Totals are computed from each
-- room's real nightly rate and the live tax_rate so demo receipts are
-- arithmetically correct. Every row is marked in guest_name and
-- internal_notes so it can never be mistaken for a real booking.
-- ---------------------------------------------------------------------------

create function restore_demo_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  tax_rate_percent numeric;
  inserted_count integer;
begin
  if current_staff_role() is distinct from 'master_admin' then
    raise exception 'Only the Master Administrator may restore demo reservations.';
  end if;

  select tax_rate into tax_rate_percent from system_configurations where id = 1;
  tax_rate_percent := coalesce(tax_rate_percent, 12);

  with demo_slots as (
    select
      pr.room_number,
      rc.nightly_rate,
      row_number() over (order by pr.room_number) as slot
    from physical_rooms pr
    join room_categories rc on rc.id = pr.category_id
    where not rc.is_archived
    order by pr.room_number
    limit 6
  ),
  demo_bookings as (
    select
      d.room_number,
      v.guest_name,
      v.guest_phone,
      current_date + v.check_in_offset as check_in_date,
      current_date + v.check_out_offset as check_out_date,
      v.adults,
      v.children,
      v.status,
      v.payment_status,
      v.paid_fraction,
      d.nightly_rate * (v.check_out_offset - v.check_in_offset) as subtotal
    from demo_slots d
    join (
      values
        (1, 'Demo — Ramesh Gupta',  '9800000001', -1, 2, 2, 0, 'Checked-In'::reservation_status,  'paid'::payment_status_type,    1.0),
        (2, 'Demo — Anita Sharma',  '9800000002',  0, 3, 2, 1, 'Confirmed'::reservation_status,   'partial'::payment_status_type, 0.5),
        (3, 'Demo — Vikram Singh',  '9800000003', -3, -1, 1, 0, 'Checked-Out'::reservation_status, 'paid'::payment_status_type,   1.0),
        (4, 'Demo — Priya Verma',   '9800000004',  2, 4, 2, 2, 'Confirmed'::reservation_status,   'unpaid'::payment_status_type,  0.0),
        (5, 'Demo — Suresh Yadav',  '9800000005', -2, 1, 3, 0, 'Checked-In'::reservation_status,  'partial'::payment_status_type, 0.4),
        (6, 'Demo — Kavita Mishra', '9800000006',  5, 7, 2, 0, 'Confirmed'::reservation_status,   'unpaid'::payment_status_type,  0.0)
    ) as v(slot, guest_name, guest_phone, check_in_offset, check_out_offset, adults, children, status, payment_status, paid_fraction)
      on v.slot = d.slot
  )
  insert into reservations (
    guest_name, guest_phone, room_number,
    check_in_date, check_out_date, adults, children,
    total_amount, tax_amount, discount_amount, amount_paid,
    payment_status, status, internal_notes
  )
  select
    b.guest_name,
    b.guest_phone,
    b.room_number,
    b.check_in_date,
    b.check_out_date,
    b.adults,
    b.children,
    round(b.subtotal * (1 + tax_rate_percent / 100), 2),
    round(b.subtotal * (tax_rate_percent / 100), 2),
    0,
    round(b.subtotal * (1 + tax_rate_percent / 100) * b.paid_fraction, 2),
    b.payment_status,
    b.status,
    'DEMO SEED — training data, safe to wipe'
  from demo_bookings b;

  get diagnostics inserted_count = row_count;

  insert into audit_logs (admin_id, action_type, description)
  values (
    auth.uid(),
    'restore_demo_data',
    format('Restored %s demo reservations for training.', inserted_count)
  );

  return inserted_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- wipe_reservations_for_testing(confirmation)
-- Deletes every reservation and enquiry in one transaction. The caller must
-- pass the exact confirmation phrase — enforced here, not just in the UI.
-- ---------------------------------------------------------------------------

create function wipe_reservations_for_testing(confirmation text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  wiped_reservations integer;
  wiped_enquiries integer;
begin
  if current_staff_role() is distinct from 'master_admin' then
    raise exception 'Only the Master Administrator may wipe the reservations ledger.';
  end if;

  if confirmation is distinct from 'WIPE ALL RESERVATIONS' then
    raise exception 'Confirmation phrase did not match; nothing was deleted.';
  end if;

  delete from reservations;
  get diagnostics wiped_reservations = row_count;

  delete from enquiries;
  get diagnostics wiped_enquiries = row_count;

  insert into audit_logs (admin_id, action_type, description)
  values (
    auth.uid(),
    'wipe_reservations',
    format(
      'Wiped the full booking dataset for testing: %s reservations and %s enquiries permanently deleted.',
      wiped_reservations,
      wiped_enquiries
    )
  );

  return wiped_reservations;
end;
$$;

-- The role check inside each function is the real gate, but there is no
-- reason for anon to be able to invoke these at all.
revoke execute on function restore_demo_reservations() from public, anon;
revoke execute on function wipe_reservations_for_testing(text) from public, anon;
grant execute on function restore_demo_reservations() to authenticated;
grant execute on function wipe_reservations_for_testing(text) to authenticated;
