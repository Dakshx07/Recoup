-- Migration 0006: Worker Queue RPC
-- Build-order step 7 (02_BACKEND_SPEC.md §4)
--
-- This function encapsulates the SELECT ... FOR UPDATE SKIP LOCKED logic
-- so that the Supabase JS client can call it via rpc().
--
-- It claims a single pending job and marks it as 'processing'.

CREATE OR REPLACE FUNCTION claim_next_job()
RETURNS TABLE (
  id BIGINT,
  job_type TEXT,
  payload JSONB,
  status TEXT,
  attempts INT,
  last_error TEXT,
  created_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ
) AS $$
DECLARE
  claimed_id BIGINT;
BEGIN
  -- 1. Find and lock the next pending job
  SELECT processing_jobs.id INTO claimed_id
  FROM processing_jobs
  WHERE processing_jobs.status = 'pending'
  ORDER BY processing_jobs.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- 2. If no job found, return empty
  IF claimed_id IS NULL THEN
    RETURN;
  END IF;

  -- 3. Mark it as processing and return it
  RETURN QUERY
  UPDATE processing_jobs
  SET 
    status = 'processing',
    claimed_at = now()
  WHERE processing_jobs.id = claimed_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
