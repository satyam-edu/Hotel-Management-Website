
create type reservation_status as enum (
  'Confirmed',
  'Checked-In',
  'Checked-Out',
  'Cancelled'
);

alter table reservations
  add column guest_name text,
  add column guest_phone text,
  add column room_number text,
  add column status reservation_status not null default 'Confirmed';

alter table reservations
  alter column enquiry_id drop not null,
  alter column assigned_room_id drop not null,
  alter column tax_amount drop not null,
  alter column tax_amount set default 0;

alter table reservations
  add constraint reservations_room_number_fkey
    foreign key (room_number) references physical_rooms (room_number)
    on delete set null;

create index reservations_status_idx on reservations (status);
create index reservations_room_number_idx on reservations (room_number);
