-- Hotel Kamala Inn Grand — Section 5.2: Global Content editor
-- Every editable guest-facing string, collapsed into one singleton row
-- (matching the system_configurations pattern). Seeded with the current
-- hardcoded copy from HeroSection.tsx, AboutSection.tsx, RoomsSection.tsx,
-- GallerySection.tsx, and ReviewsSection.tsx so nothing changes visually
-- until an admin actually edits a field.

create table site_content (
  id smallint primary key default 1,
  hero_title text not null default '',
  hero_subtitle text not null default '',
  hero_cta text not null default '',
  about_history text not null default '',
  about_philosophy text not null default '',
  rooms_intro text not null default '',
  gallery_header text not null default '',
  featured_review text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_content_singleton check (id = 1)
);

alter table site_content enable row level security;

-- Public read, same shape as system_configurations/room_categories: the
-- guest homepage needs this with no session.
create policy site_content_select_anon
  on site_content for select
  to anon, authenticated
  using (true);

-- Writes restricted to Master/Head Admin, matching room_categories_write_admin
-- (0006_room_categories_role_gate.sql) rather than the looser is_staff() gate,
-- since site copy is a branding-level concern, not day-to-day front desk work.
create policy site_content_write_admin
  on site_content for all
  to authenticated
  using (current_staff_role() in ('master_admin', 'head_admin'))
  with check (current_staff_role() in ('master_admin', 'head_admin'));

insert into site_content (
  id,
  hero_title,
  hero_subtitle,
  hero_cta,
  about_history,
  about_philosophy,
  rooms_intro,
  gallery_header,
  featured_review
)
values (
  1,
  'Hotel Kamala Inn Grand',
  'Where every stay, celebration, and gathering is treated with the warmth of home and the polish of a landmark address.',
  'Book Your Stay',
  'Set along the NH-28 bypass in Padrauna, Hotel Kamala Inn Grand has grown into one of the district''s most trusted addresses for travellers, families, and celebrations alike. What began as a modest wayside stop has become a full service property known for its banquet halls, event lawns, and genuinely warm service a reputation built one stay, one wedding, one gathering at a time.',
  'Our philosophy is simple: every guest should feel looked after, not processed. From a family arriving late off the highway to a wedding party hosting three hundred guests, the same attention to comfort, cleanliness, and courtesy carries through every corner of the property.',
  'From a quiet overnight stop to an extended family visit, every category is kept spotless, comfortable, and ready.',
  'A Closer Look at the Property',
  'We hosted our daughter''s wedding here and the banquet hall, lawn, and staff were beyond our expectations. Every guest went home impressed.'
)
on conflict (id) do nothing;
