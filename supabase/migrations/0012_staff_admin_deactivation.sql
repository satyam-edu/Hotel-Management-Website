-- Hotel Kamala Inn Grand — Real Staff Management engine
-- Soft-deactivation column (never hard-delete: audit_logs.admin_id -> staff_roles.id
-- -> auth.users.id cascades on delete, which would silently wipe a staff member's
-- entire audit history) plus new audit action types for staff create/revoke.

alter table staff_roles add column deactivated_at timestamptz;

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
    'revoke_staff'
  ));
