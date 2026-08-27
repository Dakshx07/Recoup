-- Migration 0007: Webhook events table for idempotent external webhook processing
-- Provides Level 1 Idempotency for external payment providers (Razorpay)

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'razorpay',
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate webhook processing at DB level
CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_events_source_event
  ON webhook_events(source, event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_source_type
  ON webhook_events(source, event_type);

-- Row Level Security
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- SELECT policy for authenticated reviewers for audit/observability
CREATE POLICY reviewer_read_webhook_events ON webhook_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- No client INSERT/UPDATE/DELETE policies. Server service-role client writes exclusively.
