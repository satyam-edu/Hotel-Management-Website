-- Hotel Kamala Inn Grand — Restore physical_rooms read access for sub_admin
-- 0016_room_category_manager.sql closed a real write-side RLS gap (any
-- authenticated staff, including sub_admin, could write directly against
-- physical_rooms) but did it with a single `for all` policy
-- (physical_rooms_write_admin), which also covers SELECT. That silently
-- revoked sub_admin's read access — 0016's own comment and 0022's comment
-- both describe the intent as "sub-admins keep read access; only writes are
-- narrowed," matching how 0022 split reservations into a separate
-- `reservations_select_staff` policy. physical_rooms never got that split,
-- so sub_admin/staff logins see an empty physical_rooms result (RLS blocks
-- rows silently, returning [] rather than an error) on Room Map and the
-- Availability Calendar.
--
-- This adds the missing SELECT policy, open to any staff member, exactly
-- mirroring reservations_select_staff. physical_rooms_write_admin is
-- untouched, so the write-side gate 0016 intended stays exactly as strict
-- as it was.

create policy physical_rooms_select_staff
  on physical_rooms for select
  to authenticated
  using (is_staff(auth.uid()));
