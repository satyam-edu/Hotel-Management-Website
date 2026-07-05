-- Hotel Kamala Inn Grand — Maintenance Mode kill switch
-- Guest-facing site checks this flag and replaces its entire page tree with
-- a closure notice when true. Never affects the admin console.

alter table system_configurations
  add column maintenance_mode boolean not null default false;
