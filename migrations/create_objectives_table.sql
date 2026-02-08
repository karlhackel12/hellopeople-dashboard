-- Create hp_objectives table for OKR management
CREATE TABLE IF NOT EXISTS hp_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  quarter TEXT,
  deadline DATE,
  key_results JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_objectives_status ON hp_objectives(status);
CREATE INDEX IF NOT EXISTS idx_objectives_quarter ON hp_objectives(quarter);
CREATE INDEX IF NOT EXISTS idx_objectives_owner ON hp_objectives(owner);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE
    ON hp_objectives FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample objectives
INSERT INTO hp_objectives (title, description, owner, quarter, deadline, key_results, status) VALUES
  (
    'Reach 1,000 Active Users',
    'Grow our user base to 1,000 daily active users by end of Q1',
    'Marketing',
    'Q1 2026',
    '2026-03-31',
    '[
      {"title": "Acquire 1,200 signups", "target": 1200, "current": 850, "unit": "users"},
      {"title": "Achieve 85% activation rate", "target": 85, "current": 78, "unit": "%"},
      {"title": "Maintain 70%+ 30-day retention", "target": 70, "current": 65, "unit": "%"}
    ]'::jsonb,
    'active'
  ),
  (
    'Launch Core Product Features',
    'Ship 3 major product features to improve user experience',
    'Product',
    'Q1 2026',
    '2026-03-31',
    '[
      {"title": "Ship real-time collaboration", "target": 1, "current": 0, "unit": "features"},
      {"title": "Launch mobile app beta", "target": 1, "current": 0, "unit": "features"},
      {"title": "Implement advanced analytics", "target": 1, "current": 1, "unit": "features"}
    ]'::jsonb,
    'active'
  ),
  (
    'Achieve 95% System Autonomy',
    'Increase autonomous decision-making capabilities across all agents',
    'CEO',
    'Q1 2026',
    '2026-03-31',
    '[
      {"title": "Autonomous mission success rate", "target": 95, "current": 91, "unit": "%"},
      {"title": "Agent collaboration score", "target": 90, "current": 85, "unit": "%"},
      {"title": "Human intervention reduction", "target": 80, "current": 72, "unit": "%"}
    ]'::jsonb,
    'active'
  );
