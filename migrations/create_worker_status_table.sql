-- Create worker status table for VPS worker health monitoring
CREATE TABLE IF NOT EXISTS hp_worker_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('running', 'stopped', 'crashed', 'unknown')),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  jobs_processed INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  circuit_breaker_open BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on worker_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_worker_status_worker_name ON hp_worker_status(worker_name);

-- Create index on last_heartbeat for finding stale workers
CREATE INDEX IF NOT EXISTS idx_worker_status_last_heartbeat ON hp_worker_status(last_heartbeat DESC);

-- Insert initial worker entries (with unknown status until they start reporting)
INSERT INTO hp_worker_status (worker_name, status, last_heartbeat) VALUES
  ('roundtable-worker', 'unknown', now()),
  ('x-autopost', 'unknown', now()),
  ('analyze-worker', 'unknown', now()),
  ('content-worker', 'unknown', now()),
  ('crawl-worker', 'unknown', now())
ON CONFLICT (worker_name) DO NOTHING;

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_worker_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_worker_status_timestamp ON hp_worker_status;
CREATE TRIGGER update_worker_status_timestamp
  BEFORE UPDATE ON hp_worker_status
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_status_updated_at();

-- Grant permissions (adjust based on your RLS policies)
-- Allow anon role to read worker status
ALTER TABLE hp_worker_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON hp_worker_status
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access" ON hp_worker_status
  FOR ALL
  USING (true);

-- Comment on table
COMMENT ON TABLE hp_worker_status IS 'Tracks health status of VPS workers running mission-control backend';
COMMENT ON COLUMN hp_worker_status.worker_name IS 'Unique identifier for the worker (e.g., roundtable-worker)';
COMMENT ON COLUMN hp_worker_status.status IS 'Current status: running, stopped, crashed, or unknown';
COMMENT ON COLUMN hp_worker_status.last_heartbeat IS 'Timestamp of last heartbeat from worker';
COMMENT ON COLUMN hp_worker_status.jobs_processed IS 'Total number of jobs processed by this worker';
COMMENT ON COLUMN hp_worker_status.error_count IS 'Total number of errors encountered';
COMMENT ON COLUMN hp_worker_status.circuit_breaker_open IS 'Whether worker has auto-disabled due to too many errors';
COMMENT ON COLUMN hp_worker_status.metadata IS 'Additional worker-specific metadata (JSON)';
