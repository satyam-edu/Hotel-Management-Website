-- Hotel Kamala Inn Grand — Section 1.6/5.1: Dynamic Photo Gallery.
-- GallerySection.tsx has always rendered from a hardcoded dummy array; this
-- introduces the actual database-backed ledger the admin Gallery Manager
-- writes to and the public gallery filters against. folder_tag is a plain
-- text label (not an enum) since Section 1.6 describes owner-managed named
-- folders created on demand, not a fixed category list.

create table gallery_images (
  id uuid primary key default gen_random_uuid(),
  folder_tag text not null,
  image_url text not null,
  alt_text text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table gallery_images enable row level security;

create policy gallery_images_select_anon
  on gallery_images for select
  to anon, authenticated
  using (not is_archived);

create policy gallery_images_select_staff
  on gallery_images for select
  to authenticated
  using (is_staff(auth.uid()));

create policy gallery_images_write_admin
  on gallery_images for all
  to authenticated
  using (current_staff_role() in ('master_admin', 'head_admin'))
  with check (current_staff_role() in ('master_admin', 'head_admin'));

alter publication supabase_realtime add table gallery_images;

alter table audit_logs drop constraint audit_logs_action_type_check;

alter table audit_logs add constraint audit_logs_action_type_check
  check (action_type in (
    'create_booking',
    'edit_ledger',
    'check_in',
    'check_out',
    'cancel_booking',
    'restore_booking',
    'update_rates',
    'update_availability',
    'create_staff',
    'revoke_staff',
    'create_category',
    'edit_category',
    'archive_category',
    'restore_category',
    'create_room',
    'delete_room',
    'reassign_room_category',
    'update_branding',
    'update_booking_rules',
    'update_invoice_config',
    'update_site_content',
    'toggle_maintenance_mode',
    'upload_asset',
    'upload_gallery_image',
    'archive_gallery_image',
    'restore_gallery_image'
  ));
