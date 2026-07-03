-- Hotel Kamala Inn Grand — Track amount actually received per booking
-- Closes the gap between operational status and financial payment_status:
-- payment_status alone can't express a partial-payment balance without
-- knowing how much of the total has actually been collected.

alter table reservations
  add column amount_paid numeric(10, 2) not null default 0 check (amount_paid >= 0);
