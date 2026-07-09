-- Hotel Kamala Inn Grand — Restrict reservations & system_configurations
-- writes to Head/Master Admin. Section 2.4/2.8: role checks must live at the
-- data layer, not just the UI or edge function. Two real gaps closed here:
--
-- 1. reservations_all_staff (0001) gated writes on is_staff() only, so any
--    authenticated staff — including sub_admin, whom verify-reservation's
--    edge function explicitly rejects at the application layer — could still
--    insert/update/delete reservations directly via the Supabase client,
--    bypassing both the sub_admin restriction and all server-side billing
--    recomputation. Sub-admins keep read access for dashboard viewing; only
--    writes are narrowed, matching the pattern already applied to
--    room_categories (0006) and physical_rooms (0016).
-- 2. system_configurations_write_staff (0001) let any staff member — again
--    including sub_admin — edit tax_rate and other config directly, which
--    verify-reservation trusts as authoritative for billing. Read access
--    stays public (anon + authenticated) since the guest homepage depends on
--    it; only writes are narrowed.

drop policy if exists reservations_all_staff on reservations;

create policy reservations_select_staff
  on reservations for select
  to authenticated
  using (is_staff(auth.uid()));

create policy reservations_write_admin
  on reservations for insert
  to authenticated
  with check (current_staff_role() in ('master_admin', 'head_admin'));

create policy reservations_update_admin
  on reservations for update
  to authenticated
  using (current_staff_role() in ('master_admin', 'head_admin'))
  with check (current_staff_role() in ('master_admin', 'head_admin'));

create policy reservations_delete_admin
  on reservations for delete
  to authenticated
  using (current_staff_role() in ('master_admin', 'head_admin'));

drop policy if exists system_configurations_write_staff on system_configurations;

create policy system_configurations_write_admin
  on system_configurations for all
  to authenticated
  using (current_staff_role() in ('master_admin', 'head_admin'))
  with check (current_staff_role() in ('master_admin', 'head_admin'));
