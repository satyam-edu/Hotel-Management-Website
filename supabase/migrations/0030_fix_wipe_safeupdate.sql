-- Hotel Kamala Inn Grand — Fix safeupdate rejection on the full-wipe RPC
-- The Supabase `authenticator` role (which PostgREST/supabase.rpc() connects
-- as for every RPC call) has `session_preload_libraries=supautils,
-- safeupdate` set at the role level — confirmed via `pg_roles.rolconfig`,
-- not visible via `pg_extension`/`pg_settings` since it's a preloaded
-- library on that connection role, not a registered extension. safeupdate
-- rejects any DELETE/UPDATE that has no WHERE clause, purely on SQL syntax,
-- regardless of semantics. wipe_reservations_for_testing()'s two bare
-- `delete from reservations` / `delete from enquiries` statements trip this
-- guard with SQLSTATE 21000 ("DELETE requires a WHERE clause") — SECURITY
-- DEFINER changes the effective role for permission checks, but the backend
-- process keeps whatever libraries were already preloaded for its session,
-- so the guard still applies.
--
-- Fix: append `where true` to both deletes — a syntactically real predicate
-- that satisfies safeupdate without changing which rows are removed (still
-- all of them). Everything else is unchanged from 0024: same function name
-- and parameter name (confirmation), same `returns integer` (the UI reads
-- the row count), same `is distinct from` NULL-safe role check, and the
-- same 'wipe_reservations' audit_logs action_type (the only value permitted
-- by audit_logs_action_type_check).

create or replace function wipe_reservations_for_testing(confirmation text)
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

  delete from reservations where true;
  get diagnostics wiped_reservations = row_count;

  delete from enquiries where true;
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
