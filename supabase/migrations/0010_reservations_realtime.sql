-- Hotel Kamala Inn Grand — Enable Realtime broadcasts for reservations
-- Needed so the Live Room Map (Section 4.5) reflects check-ins,
-- cancellations, and new bookings made in another tab/device instantly.

alter publication supabase_realtime add table reservations;
