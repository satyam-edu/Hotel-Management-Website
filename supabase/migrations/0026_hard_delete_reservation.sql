-- Hotel Kamala Inn Grand — Permanent ledger deletion (Master Admin only)
-- The existing cancel/archive flow (Section 4.12) is a deliberate soft
-- delete and stays the default path for staff. This adds a genuinely
-- irreversible hard-delete for the rare case for a Master Admin to purge a
-- record entirely from the relational store (e.g. a duplicate/test booking
-- or a legal erasure request) — distinct from, and far more destructive
-- than, cancellation.
--
-- SECURITY DEFINER with the role check inside the function body, matching
-- 0024's restore/wipe functions — this is the real gate, not just the UI
-- button's render condition. Deletes the reservation and its originating
-- enquiry (if any) in one transaction, so the operation is atomic: either
-- both rows are gone or neither is. An audit_logs entry is written first,
-- since after the delete there is no longer a reservation row to describe
-- the entry against.

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
    'wipe_reservations',
    'hard_delete_booking',
    'update_staff_profile',
    'delete_staff'
  ));

create function hard_delete_reservation(target_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_reservation reservations%rowtype;
begin
  if current_staff_role() is distinct from 'master_admin' then
    raise exception 'Only the Master Administrator may permanently delete a booking.';
  end if;

  select * into target_reservation from reservations where id = target_reservation_id;

  if not found then
    raise exception 'Reservation not found.';
  end if;

  insert into audit_logs (admin_id, action_type, description, actor_role, old_value)
  values (
    auth.uid(),
    'hard_delete_booking',
    format(
      'Permanently deleted booking for %s (Room %s, %s to %s).',
      coalesce(target_reservation.guest_name, 'guest'),
      coalesce(target_reservation.room_number, '—'),
      target_reservation.check_in_date,
      target_reservation.check_out_date
    ),
    current_staff_role(),
    jsonb_build_object(
      'id', target_reservation.id,
      'guest_name', target_reservation.guest_name,
      'room_number', target_reservation.room_number,
      'check_in_date', target_reservation.check_in_date,
      'check_out_date', target_reservation.check_out_date,
      'total_amount', target_reservation.total_amount
    )
  );

  if target_reservation.enquiry_id is not null then
    delete from enquiries where id = target_reservation.enquiry_id;
  end if;

  delete from reservations where id = target_reservation_id;
end;
$$;

revoke execute on function hard_delete_reservation(uuid) from public, anon;
grant execute on function hard_delete_reservation(uuid) to authenticated;
