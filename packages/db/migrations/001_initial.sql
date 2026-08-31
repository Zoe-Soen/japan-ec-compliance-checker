CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  scope jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scan_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scan_type text NOT NULL DEFAULT 'site_full',
  status text NOT NULL DEFAULT 'queued',
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  stage text NOT NULL DEFAULT '等待扫描',
  rule_version text NOT NULL DEFAULT 'mvp-0.1',
  error text,
  page_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS page_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id uuid NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'other',
  text_excerpt text NOT NULL DEFAULT '',
  linked_from_home boolean NOT NULL DEFAULT false,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id uuid NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
  rule_id text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  risk text NOT NULL,
  status text NOT NULL,
  source_url text,
  evidence text NOT NULL DEFAULT '',
  explanation text NOT NULL,
  recommendation text NOT NULL,
  basis text NOT NULL,
  confidence text NOT NULL,
  UNIQUE (scan_job_id, rule_id)
);

CREATE TABLE IF NOT EXISTS usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id uuid NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  units numeric(10,2) NOT NULL DEFAULT 0,
  page_count integer NOT NULL DEFAULT 0,
  duration_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scan_job_id, event_type)
);

CREATE INDEX IF NOT EXISTS scan_jobs_status_created_idx ON scan_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS findings_job_risk_idx ON findings(scan_job_id, risk, rule_id);
