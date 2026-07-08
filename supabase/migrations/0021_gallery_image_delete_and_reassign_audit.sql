-- Hotel Kamala Inn Grand — Gallery Manager: permanent purge and inline
-- folder reassignment both need distinct audit trail entries per Section
-- 4.13, separate from the existing archive/restore/upload actions —
-- deleting a row is irreversible (unlike archiving) and reassignment moves
-- an image between guest-facing folders without touching its file, so each
-- deserves its own action_type for an accurate audit history.

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
    'update_gallery_image_folder'
  ));
