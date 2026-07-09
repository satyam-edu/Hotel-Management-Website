-- Migration: 0028_purge_audit_logs.sql
-- Description: Gated audit log purging functionality restricted to master_admin with confirmation matching blueprint safety patterns.

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
        'SYSTEM_PURGE', 
        'Master Admin permanently purged historical audit logs older than ' || cutoff_date::DATE || ' (Cutoff: ' || months_old || ' months old).',
        'master_admin',
        NOW()
    );

    -- 5. Hard delete old records while shielding the footprint entries
    DELETE FROM audit_logs 
    WHERE created_at < cutoff_date
      AND action_type != 'SYSTEM_PURGE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;