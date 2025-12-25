ETL migration draft - user_app_state -> normalized tables
=====================================================

Purpose
-------
This directory contains a draft ETL script and guidance to migrate the monolithic
`user_app_state.state` JSONB into normalized tables (`orgs`, `personas`, `contents`, `leads`, etc).

Files
-----
- `scripts/etl_migrate_user_app_state.js`: Node.js script (pg) to extract and insert data.

How to run (staging)
--------------------
1. Ensure you have a backup of `user_app_state`:
   - Run `SELECT id, user_id, updated_at, state FROM user_app_state;` in Supabase SQL Editor and export the results.

2. Install dependencies locally:
   - `npm install pg`

3. Run the script in dry-run mode first:
   - `DATABASE_URL="postgres://..." node scripts/etl_migrate_user_app_state.js --dry-run --limit=5`

4. Inspect logs, adjust mappings in the script if your JSON structure differs.

5. When ready, run without `--dry-run` (recommended: small batches via `--limit`):
   - `DATABASE_URL="postgres://..." node scripts/etl_migrate_user_app_state.js --limit=10`

6. Verify counts and data integrity using the verification queries in `migrations/normalized_schema.sql`.

Notes
-----
- This is a draft intended for review. The script is conservative and designed to be adapted to your exact JSON schema.
- Always test in staging, never run directly against production without a verified backup.


