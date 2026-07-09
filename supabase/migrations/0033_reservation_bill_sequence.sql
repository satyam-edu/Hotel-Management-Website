-- Hotel Kamala Inn Grand — Sequential Bill No. for printed invoices
-- PrintableInvoice's "Bill No." field (e.g. "D00216") previously derived a
-- pseudo-code from the reservation's UUID, which isn't a real sequence and
-- can't match the paper register's actual incrementing numbering. This adds
-- a genuine auto-incrementing integer, generated once at insert time and
-- never reused/reassigned, so Bill No. can be formatted as a stable
-- "D" + 5-digit zero-padded sequence (D00001, D00002, ...) matching the
-- physical template.

create sequence reservations_bill_sequence;

alter table reservations
  add column bill_sequence integer not null default nextval('reservations_bill_sequence');

alter sequence reservations_bill_sequence owned by reservations.bill_sequence;

-- Backfill existing rows in creation order so historical bookings get a
-- sensible, stable, monotonically increasing number too rather than all
-- sharing whatever the column default assigned at ALTER TABLE time.
with ordered as (
  select id, row_number() over (order by created_at) as rn
  from reservations
)
update reservations
set bill_sequence = ordered.rn
from ordered
where reservations.id = ordered.id;

-- Keep the sequence itself ahead of the backfilled max so the next real
-- insert doesn't collide with a backfilled value.
select setval('reservations_bill_sequence', (select coalesce(max(bill_sequence), 0) from reservations));
