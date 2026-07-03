-- Hotel Kamala Inn Grand — Restrict room_categories writes to Head/Master Admin
-- Section 2.4/2.8: role checks must live at the data layer, not just the UI.
-- Sub-admins keep read access via room_categories_select_anon (public read),
-- but can no longer write directly through the API even if the UI is bypassed.

drop policy if exists room_categories_write_staff on room_categories;

create policy room_categories_write_admin
  on room_categories for all
  to authenticated
  using (current_staff_role() in ('master_admin', 'head_admin'))
  with check (current_staff_role() in ('master_admin', 'head_admin'));
