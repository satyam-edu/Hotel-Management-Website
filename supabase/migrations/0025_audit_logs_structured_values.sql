-- Hotel Kamala Inn Grand — Structured audit values & actor-role snapshot
-- Blueprint 4.13: audit entries capture "the responsible staff member's
-- identity and role, and both the old and new values where relevant."
-- Two gaps closed:
--
-- 1. old_value / new_value existed only as prose inside description ("Updated
--    tax rate from 12 to 18.") — human-readable but not machine-comparable.
--    They are now also stored as jsonb single-key objects ({"tax_rate": 12}),
--    so a dispute review can diff exact values without parsing sentences.
--
-- 2. actor_role was derived at READ time by joining staff_roles — meaning a
--    later role change (or account removal) silently rewrote history. It is
--    now snapshotted at INSERT time. The default current_staff_role() covers
--    every client-side insert with zero call-site changes; the edge
--    functions (which insert under the service role, where auth.uid() is
--    null) pass it explicitly. Existing rows keep null and the viewer falls
--    back to the live join for them, so history degrades gracefully rather
--    than lying.

alter table audit_logs
  add column old_value jsonb,
  add column new_value jsonb,
  add column actor_role staff_role_type default current_staff_role();
