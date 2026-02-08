-- Update worker status table with actual worker names
DELETE FROM hp_worker_status WHERE worker_name IN ('roundtable-worker', 'x-autopost', 'analyze-worker', 'content-worker', 'crawl-worker');

INSERT INTO hp_worker_status (worker_name, status, last_heartbeat) VALUES
  ('mission-worker', 'unknown', now()),
  ('roundtable-worker', 'unknown', now()),
  ('initiative-worker', 'unknown', now()),
  ('objective-proposal-worker', 'unknown', now()),
  ('outcome-learner', 'unknown', now())
ON CONFLICT (worker_name) DO NOTHING;
