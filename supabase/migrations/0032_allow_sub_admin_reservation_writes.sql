-- Hotel Kamala Inn Grand — Allow sub_admin to create/update reservations
-- Deliberate permission-model change (not a bug fix): sub_admin was
-- previously read-only for reservations, gated both by RLS
-- (reservations_write_admin / reservations_update_admin, added in 0022) and
-- by verify-reservation's edge function (which has had its matching
-- sub_admin 403 removed in this same change). Both layers must move
-- together — the edge function's handleCreate/handleUpdate write through a
-- service-role client that bypasses RLS, but Ledger.tsx's check-in/
-- check-out/cancel/restore status transitions write directly to
-- `reservations` via the regular (RLS-governed) Supabase client, so RLS is
-- still the real gate for those actions.
--
-- reservations_delete_admin is untouched — hard deletion of a reservation
-- row was never part of "create walk-in / convert booking status" and stays
-- master_admin/head_admin only.

drop policy if exists reservations_write_admin on reservations;

create policy reservations_write_admin
  on reservations for insert
  to authenticated
  with check (current_staff_role() in ('master_admin', 'head_admin', 'sub_admin'));

drop policy if exists reservations_update_admin on reservations;

create policy reservations_update_admin
  on reservations for update
  to authenticated
  using (current_staff_role() in ('master_admin', 'head_admin', 'sub_admin'))
  with check (current_staff_role() in ('master_admin', 'head_admin', 'sub_admin'));
