-- Hotel Kamala Inn Grand — Section 5.1: Supabase Storage bucket for
-- drag-and-drop image uploads (Hero, About, Room Category covers, Gallery).
-- One public bucket ("hotel-assets") with folder prefixes per asset type
-- (hero/, about/, rooms/, gallery/<folder-tag>/) rather than one bucket per
-- asset type — keeps RLS to a single policy set instead of duplicating it.
-- Bucket is public-read (guest pages load these images with no auth), but
-- writes/deletes are gated to Head/Master Admin at the storage layer itself,
-- matching the room_categories_write_admin pattern from 0006 — a role check
-- enforced only in the UI would leave the object store directly writable by
-- anyone with valid staff credentials, including sub_admin (read-only role).

insert into storage.buckets (id, name, public)
values ('hotel-assets', 'hotel-assets', true)
on conflict (id) do nothing;

create policy hotel_assets_select_anon
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'hotel-assets');

create policy hotel_assets_write_admin
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'hotel-assets'
    and current_staff_role() in ('master_admin', 'head_admin')
  );

create policy hotel_assets_update_admin
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'hotel-assets'
    and current_staff_role() in ('master_admin', 'head_admin')
  )
  with check (
    bucket_id = 'hotel-assets'
    and current_staff_role() in ('master_admin', 'head_admin')
  );

create policy hotel_assets_delete_admin
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'hotel-assets'
    and current_staff_role() in ('master_admin', 'head_admin')
  );
