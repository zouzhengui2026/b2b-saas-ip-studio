-- Cleanup and prepare user_app_state for migration
-- Run after taking a full backup of user_app_state.
-- This script:
-- 1) Lists duplicates per user_id
-- 2) Deletes duplicate rows keeping the latest updated_at per user_id
-- 3) Ensures user_id column is TEXT and adds UNIQUE constraint
-- 4) Provides RLS policy templates

-- 0) BACKUP: export user_app_state table before running any destructive ops
-- SELECT id, user_id, updated_at, state FROM user_app_state;

-- 1) Show duplicates (users with >1 row)
SELECT user_id, COUNT(*) AS cnt, MAX(updated_at) AS last_updated
FROM user_app_state
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY last_updated DESC;

-- 2) Delete duplicates, keep the latest per user_id
-- WARNING: destructive. Run only after backup.
WITH ranked AS (
  SELECT id, user_id, updated_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) AS rn
  FROM user_app_state
  WHERE user_id IS NOT NULL AND user_id <> ''
)
DELETE FROM user_app_state WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- 3) Fix empty / null user_id rows (report only)
SELECT id, user_id, updated_at FROM user_app_state WHERE user_id IS NULL OR user_id = '';

-- 4) Ensure user_id is TEXT (idempotent if already text)
ALTER TABLE user_app_state ALTER COLUMN user_id TYPE text USING user_id::text;

-- 5) Add UNIQUE constraint on user_id (idempotent if already exists)
ALTER TABLE user_app_state
  ADD CONSTRAINT IF NOT EXISTS user_app_state_user_id_unique UNIQUE (user_id);

-- 6) RLS policies: example templates for strict per-user access
ALTER TABLE user_app_state ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT their own row
DROP POLICY IF EXISTS "Users can read own state" ON user_app_state;
CREATE POLICY "Users can read own state" ON user_app_state
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own state" ON user_app_state;
CREATE POLICY "Users can insert own state" ON user_app_state
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own state" ON user_app_state;
CREATE POLICY "Users can update own state" ON user_app_state
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own state" ON user_app_state;
CREATE POLICY "Users can delete own state" ON user_app_state
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Verification queries
-- Row count after dedupe
SELECT COUNT(*) AS total_rows FROM user_app_state;

-- Sample one user's state (replace YOUR_USER_ID)
-- SELECT id, user_id, updated_at, state FROM user_app_state WHERE user_id = 'YOUR_USER_ID';


