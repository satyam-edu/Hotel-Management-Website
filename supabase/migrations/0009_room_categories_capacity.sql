-- Hotel Kamala Inn Grand — Per-category physical capacity limits
-- system_configurations.max_adults_per_room / max_children_per_room are a
-- single global default (Section 5.3 booking rules), but real capacity
-- varies by room category — a Suite realistically holds more guests than
-- a standard Deluxe room. This adds the real per-category guardrail used
-- by the Walk-In Booking intake engine (Section 4.8).

alter table room_categories
  add column max_adults smallint not null default 2 check (max_adults >= 1),
  add column max_children smallint not null default 1 check (max_children >= 0);

update room_categories set max_adults = 2, max_children = 1 where name = 'Deluxe';
update room_categories set max_adults = 2, max_children = 1 where name = 'Deluxe (Twin)';
update room_categories set max_adults = 3, max_children = 1 where name = 'Executive';
update room_categories set max_adults = 3, max_children = 1 where name = 'Executive (Twin)';
update room_categories set max_adults = 4, max_children = 2 where name = 'Suite';
