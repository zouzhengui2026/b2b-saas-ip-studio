-- Normalized schema draft for IP Studio (MVP)
-- Purpose: replace single JSONB blob storage with normalized tables for orgs/personas/contents/leads/settings
-- Run in staging first. Always BACKUP user_app_state before running.

-- =========================
-- Core tables
-- =========================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional users table (if you want to mirror supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- auth.uid()
  email TEXT,
  name TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orgs
CREATE TABLE IF NOT EXISTS orgs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orgs_user_id ON orgs(user_id);

-- Personas (IP)
CREATE TABLE IF NOT EXISTS personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  status TEXT,
  business_stage TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_org_id ON personas(org_id);

-- Contents
CREATE TABLE IF NOT EXISTS contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  title TEXT,
  body JSONB DEFAULT '{}'::jsonb,
  status TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contents_user_id ON contents(user_id);
CREATE INDEX IF NOT EXISTS idx_contents_persona_id ON contents(persona_id);
-- consider GIN index on body/metrics if queries use JSON fields:
-- CREATE INDEX idx_contents_body_gin ON contents USING gin (body);

-- Leads / Inbox / Contacts (generic)
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  org_id UUID,
  persona_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- Settings per org
CREATE TABLE IF NOT EXISTS org_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit events (optional)
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration audit: record mapping from old JSON ids to new normalized ids
CREATE TABLE IF NOT EXISTS migration_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_migration_audit_user_id ON migration_audit(user_id);

-- =========================
-- Helpers: update triggers
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- attach to common tables
DROP TRIGGER IF EXISTS update_orgs_updated_at ON orgs;
CREATE TRIGGER update_orgs_updated_at
  BEFORE UPDATE ON orgs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personas_updated_at ON personas;
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contents_updated_at ON contents;
CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- Row Level Security (example templates)
-- =========================
-- Enable RLS on these tables and use auth.uid()::text for checks
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

-- Example policies (apply in staging; adjust TO clauses as needed)
CREATE POLICY orgs_select_policy ON orgs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY orgs_insert_policy ON orgs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY orgs_update_policy ON orgs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- repeat similar policies for personas/contents/leads/org_settings

-- =========================
-- ETL / Migration outline (SQL snippets)
-- =========================
-- 1) Backup existing user_app_state:
-- SELECT id, user_id, updated_at, state FROM user_app_state;

-- 2) Example: import orgs for a given user (replace YOUR_USER_ID)
-- INSERT INTO orgs (user_id, name, meta, created_at, updated_at)
-- SELECT user_id, (org->>'name')::text, org->'meta', NOW(), NOW()
-- FROM user_app_state, jsonb_array_elements(state->'orgs') AS org
-- WHERE user_id = 'YOUR_USER_ID';

-- 3) Example: import personas (requires mapping org old id => new id if applicable)
-- For complex mappings use a PL/pgSQL function or external Node ETL that:
--  - reads user_app_state rows
--  - inserts orgs -> captures new org.id mapping
--  - inserts personas linked to new org ids -> captures persona.id mapping
--  - inserts contents referencing new persona ids

-- Node ETL pseudocode (recommended approach for complex mapping):
-- const rows = await supabase.from('user_app_state').select('user_id, state').order('updated_at', {ascending:false});
-- for (const row of rows) {
--   const state = row.state;
--   // insert orgs, record oldOrgId->newOrgId
--   // insert personas using newOrgId, record oldPersonaId->newPersonaId
--   // insert contents/leads referencing newPersonaId
-- }

-- 4) Verification queries (sample)
-- -- counts per user (compare with jsonb lengths)
-- SELECT user_id,
--   COUNT(DISTINCT o.id) as org_count,
--   COUNT(DISTINCT p.id) as persona_count,
--   COUNT(DISTINCT c.id) as content_count
-- FROM orgs o
-- LEFT JOIN personas p ON p.org_id = o.id
-- LEFT JOIN contents c ON c.persona_id = p.id
-- WHERE o.user_id = 'YOUR_USER_ID'
-- GROUP BY user_id;

-- 5) Rollback: keep original user_app_state export; do not delete until verified.

-- =========================
-- Notes
-- - Run this in staging first. Audit counts and data completeness.
-- - After migration, modify app code to read/write normalized tables.
-- - Preserve a period of dual-write or mirror writes during cutover for safety.


