-- Hotel Kamla Inn Grand — Phase 1: Core Schema & Row-Level Security
-- Target: Supabase (Postgres 15+)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type staff_role_type as enum ('master_admin', 'head_admin', 'sub_admin');
create type enquiry_status as enum ('pending', 'confirmed', 'rejected');
create type payment_status_type as enum ('unpaid', 'partial', 'paid');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table staff_roles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  role staff_role_type not null,
  created_at timestamptz not null default now()
);

-- Only one master_admin may ever exist.
create unique index staff_roles_single_master_admin
  on staff_roles (role)
  where role = 'master_admin';

create table system_configurations (
  id smallint primary key default 1,
  primary_gold text not null default '#C9A227',
  bg_charcoal text not null default '#0B1220',
  base_font_size numeric not null default 16,
  hero_bg_url text,
  about_photo_url text,
  min_booking_age smallint not null default 12,
  max_adults_per_room smallint not null default 2,
  max_children_per_room smallint not null default 2,
  check_in_time time not null default '13:00',
  check_out_time time not null default '11:00',
  cancellation_policy text not null default '',
  updated_at timestamptz not null default now(),
  constraint system_configurations_singleton check (id = 1)
);

create table room_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nightly_rate numeric(10, 2) not null check (nightly_rate >= 0),
  amenities text not null default '',
  cover_photo_url text,
  is_archived boolean not null default false,
  is_unavailable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table physical_rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null unique,
  floor smallint not null,
  category_id uuid not null references room_categories (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  full_name text not null,
  mobile text not null,
  email text not null,
  check_in_date date not null,
  check_out_date date not null,
  adults smallint not null check (adults >= 1),
  children smallint not null default 0 check (children >= 0),
  room_type_id uuid references room_categories (id) on delete set null,
  status enquiry_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint enquiries_date_order check (check_out_date > check_in_date)
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid references enquiries (id) on delete set null,
  assigned_room_id uuid not null references physical_rooms (id) on delete restrict,
  check_in_date date not null,
  check_out_date date not null,
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  tax_amount numeric(10, 2) not null check (tax_amount >= 0),
  payment_status payment_status_type not null default 'unpaid',
  is_cancelled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_date_order check (check_out_date > check_in_date)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references staff_roles (id) on delete cascade,
  action_taken text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index room_categories_active_idx
  on room_categories (id)
  where not is_archived and not is_unavailable;

create index physical_rooms_category_idx on physical_rooms (category_id);
create index enquiries_status_idx on enquiries (status);
create index enquiries_dates_idx on enquiries (check_in_date, check_out_date);
create index reservations_room_dates_idx on reservations (assigned_room_id, check_in_date, check_out_date);
create index reservations_active_idx on reservations (id) where not is_cancelled;
create index audit_logs_created_at_idx on audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Role helper (SECURITY DEFINER to avoid RLS self-recursion on staff_roles)
-- ---------------------------------------------------------------------------

create function is_staff(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from staff_roles where id = uid);
$$;

create function current_staff_role()
returns staff_role_type
language sql
security definer
set search_path = public
stable
as $$
  select role from staff_roles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

alter table system_configurations enable row level security;
alter table room_categories enable row level security;
alter table physical_rooms enable row level security;
alter table enquiries enable row level security;
alter table reservations enable row level security;
alter table audit_logs enable row level security;
alter table staff_roles enable row level security;

-- system_configurations: public read, staff write
create policy system_configurations_select_anon
  on system_configurations for select
  to anon, authenticated
  using (true);

create policy system_configurations_write_staff
  on system_configurations for all
  to authenticated
  using (is_staff(auth.uid()))
  with check (is_staff(auth.uid()));

-- room_categories: public read, staff write
create policy room_categories_select_anon
  on room_categories for select
  to anon, authenticated
  using (true);

create policy room_categories_write_staff
  on room_categories for all
  to authenticated
  using (is_staff(auth.uid()))
  with check (is_staff(auth.uid()));

-- enquiries: anon insert-only, staff full read/update
create policy enquiries_insert_anon
  on enquiries for insert
  to anon, authenticated
  with check (true);

create policy enquiries_select_staff
  on enquiries for select
  to authenticated
  using (is_staff(auth.uid()));

create policy enquiries_update_staff
  on enquiries for update
  to authenticated
  using (is_staff(auth.uid()))
  with check (is_staff(auth.uid()));

create policy enquiries_delete_staff
  on enquiries for delete
  to authenticated
  using (is_staff(auth.uid()));

-- reservations: staff-only
create policy reservations_all_staff
  on reservations for all
  to authenticated
  using (is_staff(auth.uid()))
  with check (is_staff(auth.uid()));

-- physical_rooms: staff-only
create policy physical_rooms_all_staff
  on physical_rooms for all
  to authenticated
  using (is_staff(auth.uid()))
  with check (is_staff(auth.uid()));

-- audit_logs: staff-only, append-only (no update/delete policy defined —
-- default-deny means even staff cannot mutate history, per section 11.3)
create policy audit_logs_select_staff
  on audit_logs for select
  to authenticated
  using (is_staff(auth.uid()));

create policy audit_logs_insert_staff
  on audit_logs for insert
  to authenticated
  with check (is_staff(auth.uid()));

-- staff_roles: staff-only read; writes reserved for master/head admin via
-- server-side logic, so no direct client write policy is granted here.
create policy staff_roles_select_staff
  on staff_roles for select
  to authenticated
  using (is_staff(auth.uid()));
