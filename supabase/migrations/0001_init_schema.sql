-- Migration 0001: Initial schema — all core tables
-- Build-order step 1 (02_BACKEND_SPEC.md §2)
-- 
-- Why one migration for all tables: these tables have foreign-key relationships
-- that require a specific creation order. Splitting them across migrations would
-- require careful ordering and add complexity without benefit at the MVP stage.

-- MERCHANTS — mutable reference data
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DEBTORS — mutable reference data
CREATE TABLE debtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  name TEXT NOT NULL,
  contact_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INVOICES — mutable (outstanding_amount/status evolve with payments)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  debtor_id UUID NOT NULL REFERENCES debtors(id),
  invoice_number TEXT NOT NULL,
  original_amount NUMERIC(14,2) NOT NULL CHECK (original_amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  original_due_date DATE NOT NULL,
  outstanding_amount NUMERIC(14,2) NOT NULL CHECK (outstanding_amount >= 0),
  status TEXT NOT NULL CHECK (status IN
    ('OVERDUE','IN_RECOVERY','CLOSED_PAID','CLOSED_PARTIAL','CLOSED_WRITTEN_OFF')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RECOVERY_CASES — mutable "current status" with escalation fields
CREATE TABLE recovery_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  state TEXT NOT NULL CHECK (state IN
    ('OPEN','AWAITING_REPLY','REPLY_PROCESSING','COMMITMENT_ACTIVE',
     'DISPUTE_OPEN','GHOSTED','ESCALATED',
     'CLOSED_PAID','CLOSED_PARTIAL','CLOSED_WRITTEN_OFF')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closure_reason TEXT,
  escalation_level TEXT NOT NULL DEFAULT 'NONE' CHECK (escalation_level IN
    ('NONE','REMINDER_2','REMINDER_3','HUMAN_REVIEW','COLLECTIONS_HANDOFF')),
  escalation_reason TEXT,
  escalated_at TIMESTAMPTZ,
  escalation_resolved_at TIMESTAMPTZ,
  escalation_resolution TEXT,
  simulated_time_ref TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PAYMENT_LINKS — mutable (status transitions only)
CREATE TABLE payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  external_link_id TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN
    ('CREATED','PAID','EXPIRED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- OUTREACH_MESSAGES — append-only
CREATE TABLE outreach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_case_id UUID NOT NULL REFERENCES recovery_cases(id),
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  template_type TEXT NOT NULL CHECK (template_type IN
    ('initial','reminder','clarification','escalation_notice')),
  drafted_by TEXT NOT NULL CHECK (drafted_by IN ('llm','human')),
  payment_link_id UUID REFERENCES payment_links(id),
  raw_content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DEBTOR_REPLIES — append-only, immutable ground truth
CREATE TABLE debtor_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_case_id UUID NOT NULL REFERENCES recovery_cases(id),
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  external_message_id TEXT NOT NULL,
  raw_content TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REPLY_PARSES — append-only; LLM output kept separate from raw evidence
-- Why separate from debtor_replies: immutable ground truth (raw message) stays
-- separate from one model version's interpretation. A re-parse with a newer model
-- adds a row here without touching the evidence.
CREATE TABLE reply_parses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_reply_id UUID NOT NULL REFERENCES debtor_replies(id),
  model_version TEXT NOT NULL,
  parsed_intent_type TEXT NOT NULL CHECK (parsed_intent_type IN
    ('PROMISE_CANDIDATE','DISPUTE_CANDIDATE','PAYMENT_CLAIM','OTHER','AMBIGUOUS')),
  extracted_amount NUMERIC(14,2),
  extracted_date DATE,
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  raw_model_output JSONB NOT NULL,
  schema_valid BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMMITMENTS — the core ledger; mutable until terminal, then frozen
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_case_id UUID NOT NULL REFERENCES recovery_cases(id),
  source_reply_parse_id UUID REFERENCES reply_parses(id),
  promised_amount NUMERIC(14,2) NOT NULL CHECK (promised_amount > 0),
  promised_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN
    ('CANDIDATE','VALID_ACTIVE','INVALIDATED','KEPT','PARTIALLY_KEPT',
     'BROKEN','VOIDED_BY_DISPUTE','SUPERSEDED')),
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  validated_by TEXT NOT NULL CHECK (validated_by IN ('policy_engine','human')),
  validation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- PAYMENTS — append-only, immutable financial fact
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  payment_link_id UUID REFERENCES payment_links(id),
  external_payment_id TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_source TEXT NOT NULL CHECK (verification_source IN
    ('webhook_plus_api_check','manual_reconciliation')),
  raw_webhook_payload JSONB NOT NULL
);

-- AUDIT_EVENTS — append-only, DB-privilege-enforced immutable
CREATE TABLE audit_events (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN
    ('recovery_case','commitment','invoice','payment')),
  entity_id UUID NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN
    ('system','policy_engine','llm','payment_verifier','human')),
  event_type TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  reason TEXT,
  details JSONB,
  related_ids JSONB,
  simulated_time TIMESTAMPTZ,
  real_wall_clock_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROCESSING_JOBS — the only "queue"; a Postgres table
-- Why not Redis/Kafka: at ~200 invoices, a distributed broker is infrastructure
-- for appearance, not need. SELECT...FOR UPDATE SKIP LOCKED gives correct
-- queue semantics natively (see ADR 0004).
CREATE TABLE processing_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN
    ('parse_reply','verify_payment','advance_clock_check')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
    ('pending','processing','done','failed')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ
);
