-- Hotel Kamala Inn Grand — Phase 4: Ledger billing & invoice fields
-- Adds discount + internal notes to reservations (needed for the Edit
-- Ledger Modal, Section 4.9) and invoice configuration to
-- system_configurations (needed for Receipt Generation, Section 4.10).
-- These are real, permanent columns — the future Branding & Content
-- Customizer (Section 5.1) will expose the invoice fields through a form,
-- the same way check_in_time/cancellation_policy already work today.

alter table reservations
  add column discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  add column internal_notes text not null default '';

alter table system_configurations
  add column tax_rate numeric(5, 2) not null default 12 check (tax_rate >= 0),
  add column tax_id text not null default '',
  add column invoice_terms text not null default '';
