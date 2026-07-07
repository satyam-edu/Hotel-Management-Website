-- Hotel Kamala Inn Grand — Section 4.13: state-differential audit logging
-- for every Customizer save handler (Branding, Booking Rules, Invoice
-- Configuration, Global Content) and the Maintenance Mode kill switch, none
-- of which wrote to audit_logs before this. Mirrors the pattern established
-- in 0012_staff_admin_deactivation.sql / 0016_room_category_manager.sql.

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
    'toggle_maintenance_mode'
  ));
