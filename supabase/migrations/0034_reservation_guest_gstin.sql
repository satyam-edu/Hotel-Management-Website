-- Hotel Kamala Inn Grand — Customer GSTIN on reservations
-- PrintableInvoice's "GSTIN No." field (in the client meta grid) was
-- previously a free-text input that reset every time the invoice was
-- reopened — nothing persisted it. This adds a real column so front desk
-- staff can record a guest/company's GSTIN once in Edit Ledger and have it
-- show up consistently on every future print of that booking's invoice.

alter table reservations add column guest_gstin text not null default '';
