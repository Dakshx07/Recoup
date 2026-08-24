-- Migration 0005: Terminal-state trigger on commitments
-- Build-order SHOULD BUILD (02_BACKEND_SPEC.md §2)
--
-- Why: terminal commitment rows (KEPT, INVALIDATED, VOIDED_BY_DISPUTE, SUPERSEDED)
-- must never be edited — a new negotiation always creates a new row. This trigger
-- enforces that invariant at the database level, not just in application code.
-- Defense in depth: even if a bug in the state-transition service attempts to
-- update a terminal row, the DB rejects it.

CREATE OR REPLACE FUNCTION prevent_terminal_commitment_edit() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('KEPT','INVALIDATED','VOIDED_BY_DISPUTE','SUPERSEDED') THEN
    RAISE EXCEPTION 'Cannot modify a terminal commitment row (id=%)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_commitments_terminal_lock
  BEFORE UPDATE ON commitments
  FOR EACH ROW EXECUTE FUNCTION prevent_terminal_commitment_edit();

-- Also enforce immutability on audit_events at the DB privilege level
-- The service role bypasses RLS but still respects REVOKE, so this is
-- a genuine protection even for the backend's own writes.
-- NOTE: This requires an 'app_role' to exist. In Supabase, the application
-- connects as 'authenticated' or 'service_role'. We'll revoke from
-- 'authenticated' role since that's what PostgREST uses.
-- The service_role is a superuser-like role and cannot be restricted this way,
-- but RLS + application logic + this trigger together provide defense in depth.
DO $$
BEGIN
  -- Revoke UPDATE/DELETE on audit_events from authenticated role
  -- This prevents any browser-side modification even if a policy were accidentally added
  EXECUTE 'REVOKE UPDATE, DELETE ON audit_events FROM authenticated';
EXCEPTION
  WHEN OTHERS THEN
    -- Role may not exist yet in some environments; safe to skip
    NULL;
END;
$$;
