-- Hotel Kamala Inn Grand — Enable Realtime broadcasts for room_categories
-- Needed so Room Rates edits in one admin tab (Section 4.3) and the
-- guest-facing live room list (Section 1.4) both reflect changes instantly.

alter publication supabase_realtime add table room_categories;
