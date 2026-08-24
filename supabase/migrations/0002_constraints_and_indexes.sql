-- Migration 0002: Constraints, indexes, and unique constraints
-- Build-order step 1 (02_BACKEND_SPEC.md §2)
--
-- Separated from table creation for clarity. These constraints are load-bearing
-- for idempotency (unique indexes), concurrency safety (partial unique indexes),
-- and query performance (foreign-key indexes).

-- DEBTORS
CREATE INDEX idx_debtors_merchant ON debtors(merchant_id);

-- INVOICES
CREATE UNIQUE INDEX uq_invoices_merchant_number ON invoices(merchant_id, invoice_number);
CREATE INDEX idx_invoices_merchant ON invoices(merchant_id);
CREATE INDEX idx_invoices_debtor ON invoices(debtor_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- RECOVERY_CASES
-- Why partial unique index: enforces "one open recovery case per invoice" at the
-- DB level — an application-level check alone would be vulnerable to race conditions.
CREATE UNIQUE INDEX uq_recovery_cases_one_open_per_invoice
  ON recovery_cases(invoice_id) WHERE closed_at IS NULL;
CREATE INDEX idx_recovery_cases_state ON recovery_cases(state);

-- PAYMENT_LINKS
-- Why unique on external_link_id: makes duplicate payment link creation a safe no-op
CREATE UNIQUE INDEX uq_payment_links_external ON payment_links(external_link_id);
CREATE INDEX idx_payment_links_invoice ON payment_links(invoice_id);

-- OUTREACH_MESSAGES
CREATE INDEX idx_outreach_case ON outreach_messages(recovery_case_id);

-- DEBTOR_REPLIES
-- Why unique on external_message_id: dedup guarantee — second insert is a safe no-op
CREATE UNIQUE INDEX uq_debtor_replies_external ON debtor_replies(external_message_id);
CREATE INDEX idx_debtor_replies_case ON debtor_replies(recovery_case_id);

-- REPLY_PARSES
CREATE INDEX idx_reply_parses_reply ON reply_parses(debtor_reply_id);

-- COMMITMENTS
CREATE INDEX idx_commitments_case ON commitments(recovery_case_id);
CREATE INDEX idx_commitments_status ON commitments(status);
-- Why partial unique index: enforces "one VALID_ACTIVE commitment per case" at the
-- DB level — prevents the application from accidentally creating two active commitments
-- for the same case, which would break the state machine invariants.
CREATE UNIQUE INDEX uq_commitments_one_active_per_case
  ON commitments(recovery_case_id) WHERE status = 'VALID_ACTIVE';

-- PAYMENTS
-- Why unique on external_payment_id: idempotency — duplicate webhooks are a safe no-op
CREATE UNIQUE INDEX uq_payments_external ON payments(external_payment_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- AUDIT_EVENTS
CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_events(real_wall_clock_time);

-- PROCESSING_JOBS
CREATE INDEX idx_jobs_status ON processing_jobs(status, created_at);
