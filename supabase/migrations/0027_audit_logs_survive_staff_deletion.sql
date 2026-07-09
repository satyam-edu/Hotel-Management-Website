-- Hotel Kamala Inn Grand — Audit log must outlive a deleted staff account
-- audit_logs.admin_id was `references staff_roles (id) on delete cascade`
-- (0001_init_schema.sql:100), which itself references auth.users(id) on
-- delete cascade (0001:19). That means deleting a staff account — the new
-- capability this migration's companion feature adds — would silently
-- cascade-delete every audit_logs row that staff member ever created,
-- destroying permanent history in direct violation of Section 11.3's "the
-- audit log... should never be purged" guarantee. This must be fixed before
-- staff-admin's "delete" action is safe to use.
--
-- Fix: admin_id becomes nullable and switches to on delete set null, so a
-- deleted account's past actions remain in the log (as a fact that
-- genuinely happened) but no longer resolve to a live staff_roles row. The
-- description text already names the actor at the time of the action, so
-- the entry stays meaningful even once admin_id is null.

alter table audit_logs alter column admin_id drop not null;

alter table audit_logs drop constraint audit_logs_admin_id_fkey;

alter table audit_logs add constraint audit_logs_admin_id_fkey
  foreign key (admin_id) references staff_roles (id) on delete set null;
