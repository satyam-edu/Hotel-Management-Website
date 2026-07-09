-- Hotel Kamala Inn Grand — Fix purge_audit_logs (0028)
-- 0028_purge_audit_logs.sql introduced two real bugs before this ever ran
-- against real data:
--
-- 1. Its own footprint INSERT uses action_type = 'SYSTEM_PURGE', which was
--    never added to audit_logs_action_type_check — every call would hit a
--    constraint violation on that INSERT and roll back the entire
--    transaction (including the DELETE), so the function has never
--    actually been able to succeed. 'system_purge' is added here, matching
--    this codebase's existing lowercase_snake_case action_type convention
--    (every other value in the constraint is lowercase; 'SYSTEM_PURGE' was
--    the only uppercase outlier).
-- 2. The function had no `SET search_path`, unlike every other
--    SECURITY DEFINER function here (is_staff, current_staff_role,
--    restore_demo_reservations, wipe_reservations_for_testing,
--    hard_delete_reservation) — a SECURITY DEFINER function without a
--    pinned search_path can be tricked into resolving an unqualified
--    identifier against an attacker-controlled object earlier in the
--    caller's search_path, a well-known Postgres privilege-escalation
--    vector. Pinned here for consistency and safety.
--
-- Kept as a hard, irreversible delete per explicit product decision — this
-- deliberately overrides the "audit log is permanent, never purged"
-- guarantee described in the architecture blueprint (Section 11.3) and
-- 0027_audit_logs_survive_staff_deletion.sql's own header comment. That
-- tension is real and was raised; the Master Admin retention-cleanup need
-- was chosen over the permanence guarantee for this specific, tightly
-- gated, confirmation-locked action.

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
    'delete_staff',
    'system_purge'
  ));

CREATE OR REPLACE FUNCTION purge_audit_logs(months_old INT, typed_confirmation TEXT)
RETURNS VOID AS $$
DECLARE
    caller_role TEXT;
    cutoff_date TIMESTAMP;
BEGIN
    -- 1. Security Check: Only master_admin allowed
    SELECT current_staff_role() INTO caller_role;
    IF caller_role != 'master_admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only the Master Admin can purge logs.';
    END IF;

    -- 2. Strict text confirmation check
    IF typed_confirmation != 'PURGE HISTORICAL LOGS' THEN
        RAISE EXCEPTION 'Invalid confirmation text.';
    END IF;

    -- 3. Calculate cutoff date based on parameter input
    cutoff_date := NOW() - (months_old || ' month')::INTERVAL;

    -- 4. Leave a permanent footprint system row describing the purge action
    INSERT INTO audit_logs (action_type, description, actor_role, created_at)
    VALUES (
        'system_purge',
        'Master Admin permanently purged historical audit logs older than ' || cutoff_date::DATE || ' (Cutoff: ' || months_old || ' months old).',
        'master_admin',
        NOW()
    );

    -- 5. Hard delete old records while shielding the footprint entries
    DELETE FROM audit_logs
    WHERE created_at < cutoff_date
      AND action_type != 'system_purge';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

revoke execute on function purge_audit_logs(int, text) from public, anon;
grant execute on function purge_audit_logs(int, text) to authenticated;
