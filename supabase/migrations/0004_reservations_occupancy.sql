-- Hotel Kamala Inn Grand — Add occupancy fields to reservations
-- Needed so guest-count data collected at the enquiry stage (Section 1.8)
-- survives conversion into a confirmed booking rather than being dropped.

alter table reservations
  add column adults smallint not null default 1 check (adults >= 1),
  add column children smallint not null default 0 check (children >= 0);
