-- Migration 0003: Row Level Security policies
-- Build-order step 2 (02_BACKEND_SPEC.md §3)
--
-- Non-negotiable: applied immediately after schema, not deferred.
-- The PostgREST bypass risk (01_SYSTEM_DESIGN.md §5): without RLS, an
-- authenticated browser client could write directly to state-bearing tables
-- via Supabase's auto-generated REST API, bypassing the state-transition service.
--
-- Strategy:
--   1. Enable RLS on ALL tables (not just state-bearing ones — defense in depth)
--   2. No INSERT/UPDATE/DELETE policies for anon/authenticated on state-bearing tables
--   3. Narrowly-scoped SELECT-only policies for the authenticated reviewer
--   4. All writes happen via the backend's service-role client (bypasses RLS by design)

-- Enable RLS on every table
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtor_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_parses ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- SELECT-only policies for the authenticated reviewer role
-- These are the ONLY access paths from the browser — no writes allowed.

CREATE POLICY reviewer_read_merchants ON merchants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY reviewer_read_debtors ON debtors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY reviewer_read_invoices ON invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY reviewer_read_cases ON recovery_cases
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY reviewer_read_payment_links ON payment_links
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY reviewer_read_outreach ON outreach_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY reviewer_read_replies ON debtor_replies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY reviewer_read_parses ON reply_parses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY reviewer_read_commitments ON commitments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY reviewer_read_payments ON payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY reviewer_read_audit ON audit_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- processing_jobs: no browser access at all (internal queue)
-- No SELECT policy = no access for anon/authenticated via PostgREST

-- IMPORTANT: No INSERT/UPDATE/DELETE policies are defined for anon/authenticated
-- on ANY table. All writes happen exclusively via the Next.js backend using the
-- Supabase service-role key (server-side env var, never shipped to the browser),
-- which bypasses RLS by design.
--
-- This makes the state-transition service the only write path IN PRACTICE,
-- not just in intention.
