-- Hotel Kamala Inn Grand — Room Category Manager & Physical Room Mapper
-- Adds a description field for the category-create form (amenities already
-- exists as a comma-separated string, matches how RoomsSection.tsx already
-- parses it — no change needed there). Closes a real RLS gap: physical_rooms
-- writes were never role-gated after room_categories got tightened in
-- 0006_room_categories_role_gate.sql, meaning any authenticated staff
-- (including sub_admin, who the blueprint defines as read-only) could still
-- write directly against physical_rooms even with the UI hiding the controls
-- — Section 2.4/2.8 requires the check live at the data layer, not just the
-- UI. Also extends the audit_logs action_type constraint for the new
-- category/room CRUD actions this feature introduces, following the same
-- pattern as 0012_staff_admin_deactivation.sql's create_staff/revoke_staff.

alter table room_categories add column description text not null default '';

drop policy if exists physical_rooms_all_staff on physical_rooms;

create policy physical_rooms_write_admin
  on physical_rooms for all
  to authenticated
  using (current_staff_role() in ('master_admin', 'head_admin'))
  with check (current_staff_role() in ('master_admin', 'head_admin'));

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
    'reassign_room_category'
  ));
