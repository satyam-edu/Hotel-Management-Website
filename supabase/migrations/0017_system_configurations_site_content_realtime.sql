-- Hotel Kamala Inn Grand — Enable Realtime broadcasts for system_configurations
-- and site_content
-- Needed so Branding & Settings / Booking Rules / Global Content edits made
-- in the admin Customizer reach every open guest tab instantly, with no
-- reload — SystemContext.tsx and SiteContentContext.tsx both now subscribe
-- to postgres_changes on these tables.

alter publication supabase_realtime add table system_configurations;
alter publication supabase_realtime add table site_content;
