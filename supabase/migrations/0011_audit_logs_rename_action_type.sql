-- Hotel Kamala Inn Grand — Phase 7: Rename audit_logs.action_taken to action_type
-- Clarifies intent: this column holds a short category (e.g. "create_booking",
-- "edit_ledger"), while description holds the human-readable summary sentence.

alter table audit_logs rename column action_taken to action_type;

alter table audit_logs add constraint audit_logs_action_type_check
  check (action_type in (
    'create_booking',
    'edit_ledger',
    'check_in',
    'check_out',
    'cancel_booking',
    'restore_booking',
    'update_rates',
    'update_availability'
  ));

