Staging Migration Runbook — user_app_state JSONB -> Normalized Tables
==================================================================

Purpose
-------
Step-by-step safe runbook to migrate `user_app_state.state` JSONB into normalized tables (`orgs`, `personas`, `contents`, `accounts`, `leads`, `references`, `inbox_items`).
This runbook assumes you will run in staging first, validate, then run production in small batches.

Prerequisites
-------------
- Backup of `user_app_state` table export (JSON/CSV). See "Backup" step below.
- `migrations/normalized_schema.sql` already applied in staging (create tables + triggers + RLS).
- `scripts/etl_migrate_user_app_state.js` is available and tested in --dry-run mode.
- A staging DB connection string available and reachable from the machine that will run the ETL.

Files in repo
-------------
- `migrations/normalized_schema.sql` — table DDL, indexes, RLS templates.
- `migrations/cleanup_user_app_state.sql` — dedupe & RLS fix queries.
- `scripts/etl_migrate_user_app_state.js` — ETL script (supports --dry-run and --input-file).
- `migrations/sample_user_app_state.json` — sample for dry-run testing.

Runbook - High level
--------------------
1. Backup (mandatory)
   - In Supabase SQL Editor:
     ```sql
     -- export via UI or run and download result
     SELECT id, user_id, updated_at, state
     FROM user_app_state
     ORDER BY updated_at DESC;
     ```
   - Save a copy (S3/local) and keep until migration is fully verified.

2. Dedupe & prepare (staging)
   - Review duplicates:
     ```sql
     SELECT user_id, COUNT(*) AS cnt, MAX(updated_at) AS last_updated
     FROM user_app_state
     GROUP BY user_id
     HAVING COUNT(*) > 1
     ORDER BY last_updated DESC;
     ```
   - If duplicates exist, run cleanup script (after backup):
     ```sql
     -- from migrations/cleanup_user_app_state.sql
     -- run the DELETE part to keep latest row per user_id
     WITH ranked AS (
       SELECT id, user_id, updated_at,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) AS rn
       FROM user_app_state
       WHERE user_id IS NOT NULL AND user_id <> ''
     )
     DELETE FROM user_app_state WHERE id IN (
       SELECT id FROM ranked WHERE rn > 1
     );
     ```
   - Ensure user_id column is TEXT and UNIQUE constraint can be applied later.

3. Create normalized tables (staging)
   - Apply `migrations/normalized_schema.sql` in staging SQL Editor.
   - Verify tables `orgs`, `personas`, `contents`, `accounts`, `leads`, `references`, `inbox_items` exist.

4. Dry-run ETL (validate mapping)
   - Run locally or from a staging runner with connection to staging DB:
     ```bash
     # dry-run from local sample file:
     node ./scripts/etl_migrate_user_app_state.js --dry-run --input-file="migrations/sample_user_app_state.json"

     # OR dry-run against staging DB (ensure DATABASE_URL env var is set)
     export DATABASE_URL='postgresql://user:pass@host:5432/postgres?sslmode=require'
     node ./scripts/etl_migrate_user_app_state.js --dry-run --limit=10
     ```
   - Inspect output: planned SQL previews, oldId → newId mappings. Verify fields map correctly (orgId, personaId, persona.orgId, content.personaId).

5. Small-batch write (staging) — SAFE MODE
   - Implement a single small batch (limit e.g. 5 users). Use the ETL with write mode:
     ```bash
     export DATABASE_URL='postgresql://...'
     node ./scripts/etl_migrate_user_app_state.js --limit=5
     ```
   - Script behavior:
     - For each row it wraps operations per user in a transaction (BEGIN/COMMIT).
     - It upserts orgs, inserts personas and contents (current script supports these writes).
     - accounts/leads/references/inbox_items are currently previewed — extend script to write them if desired.
   - Verification after batch:
     ```sql
     -- counts
     SELECT user_id,
       COUNT(DISTINCT o.id) AS org_count,
       COUNT(DISTINCT p.id) AS persona_count,
       COUNT(DISTINCT c.id) AS content_count
     FROM orgs o
     LEFT JOIN personas p ON p.org_id = o.id
     LEFT JOIN contents c ON c.persona_id = p.id
     WHERE o.user_id IN ('<sample_user_ids_comma>')
     GROUP BY user_id;
     ```
   - Also verify sample rows and links:
     ```sql
     SELECT * FROM personas WHERE user_id = '<user_id>' LIMIT 10;
     SELECT * FROM contents WHERE user_id = '<user_id>' LIMIT 10;
     ```

6. Rollback procedure (per-batch)
   - Because ETL runs per-user in a transaction, if a transaction failed it will be rolled back automatically.
   - For an executed batch, to rollback manually (if no mapping table created) use created_at window and user_id:
     ```sql
     -- find recent inserted rows by created_at >= '<migration_start_time>'
     DELETE FROM contents WHERE created_at >= '2025-12-25 12:00:00+00' AND user_id = '<user_id>';
     DELETE FROM personas WHERE created_at >= '2025-12-25 12:00:00+00' AND user_id = '<user_id>';
     DELETE FROM orgs WHERE created_at >= '2025-12-25 12:00:00+00' AND user_id = '<user_id>';
     ```
   - Best practice: ETL should create a migration_audit table logging old_id -> new_id so rollback is trivial:
     ```sql
     CREATE TABLE IF NOT EXISTS migration_audit (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       user_id TEXT,
       source_table TEXT,
       source_id TEXT,
       target_table TEXT,
       target_id UUID,
       created_at TIMESTAMPTZ DEFAULT now()
     );
     ```
   - We can add audit inserts to ETL to enable precise rollback.

7. Scale up
   - After verifying successful small batch, increase batch size (e.g. 20, 50) and repeat until all users migrated.
   - Monitor errors, RLS, and performance.

8. Cutover
   - Modify application to read from normalized tables (dual-read mode for safety).
   - Once stable, stop writing to `user_app_state` or keep as read-only backup for a grace period.

Notes & Limitations
-------------------
- The current ETL script writes orgs/personas/contents. It previews accounts/leads/references/inbox items — implement writes for these entities if you need them migrated too.  
- Always run in staging first and validate counts.  
- Ensure RLS policies allow the migration role to write, or run ETL as a superuser during migration (not recommended in prod).

Next steps I will take
---------------------
1. Add `migration_audit` support to ETL so every insert logs old->new mapping (for deterministic rollback).  
2. Prepare a small-batch write script (wrapper) that sets migration_start_time and runs ETL with `--limit` and logs outputs.  
3. Provide a PR with runbook and updated ETL (audit) for your review.


