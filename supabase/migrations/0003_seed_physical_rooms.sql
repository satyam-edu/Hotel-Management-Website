-- Hotel Kamala Inn Grand — Seed room_categories and physical_rooms
-- Generated from src/data/inventory.ts (Phase 5 inventory).
-- Nightly rates below are placeholders — update them from the
-- Branding & Content Customizer (or directly in room_categories)
-- once real pricing is confirmed.

insert into room_categories (name, nightly_rate, amenities)
select v.name, v.nightly_rate, v.amenities
from (
  values
    ('Deluxe', 2499, 'Queen bed, Free Wi-Fi, Air conditioning'),
    ('Deluxe (Twin)', 2499, 'Twin beds, Free Wi-Fi, Air conditioning'),
    ('Executive', 3599, 'King bed, Living area, Free Wi-Fi, Air conditioning'),
    ('Executive (Twin)', 3599, 'Twin beds, Living area, Free Wi-Fi, Air conditioning'),
    ('Suite', 5499, 'Separate living room, Premium bedding, City view, Mini bar')
) as v(name, nightly_rate, amenities)
where not exists (
  select 1 from room_categories rc where rc.name = v.name
);

insert into physical_rooms (room_number, floor, category_id)
values
  ('201', 2, (select id from room_categories where name = 'Deluxe (Twin)')),
  ('202', 2, (select id from room_categories where name = 'Deluxe')),
  ('203', 2, (select id from room_categories where name = 'Executive')),
  ('204', 2, (select id from room_categories where name = 'Executive')),
  ('205', 2, (select id from room_categories where name = 'Executive')),
  ('206', 2, (select id from room_categories where name = 'Executive')),
  ('207', 2, (select id from room_categories where name = 'Executive')),
  ('208', 2, (select id from room_categories where name = 'Executive')),
  ('209', 2, (select id from room_categories where name = 'Executive')),
  ('210', 2, (select id from room_categories where name = 'Executive')),
  ('211', 2, (select id from room_categories where name = 'Executive')),
  ('212', 2, (select id from room_categories where name = 'Executive')),
  ('214', 2, (select id from room_categories where name = 'Executive')),
  ('215', 2, (select id from room_categories where name = 'Executive')),
  ('216', 2, (select id from room_categories where name = 'Executive (Twin)')),
  ('301', 3, (select id from room_categories where name = 'Suite')),
  ('302', 3, (select id from room_categories where name = 'Executive')),
  ('303', 3, (select id from room_categories where name = 'Executive'))
on conflict (room_number) do nothing;
