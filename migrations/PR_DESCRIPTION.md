Migration PR: Normalize user_app_state -> orgs/personas/contents
=============================================================

Summary
-------
This PR prepares the repository for migrating from the monolithic `user_app_state.state` JSONB storage
to a normalized schema with `orgs`, `personas`, `contents`, `leads`, and `org_settings`.

What I added in this branch
- `migrations/normalized_schema.sql` -- draft CREATE TABLE / RLS / triggers for normalized tables.
- `migrations/cleanup_user_app_state.sql` -- cleanup/dedupe + RLS templates and verification queries.
- `scripts/etl_migrate_user_app_state.js` -- Node (pg) ETL draft (dry-run by default) to map JSON -> normalized tables.
- `migrations/ETL_README.md` -- how to run the ETL safely in staging.

Important notes & run strategy
-----------------------------
1. Do not run any destructive SQL on production without a prior backup and validation in staging.
2. Backup: export `SELECT id, user_id, updated_at, state FROM user_app_state;` and save the file.
3. Run the ETL script in dry-run on staging and review logs:
   - `DATABASE_URL="postgres://..." node scripts/etl_migrate_user_app_state.js --dry-run --limit=5`
4. Adjust mapping in `scripts/etl_migrate_user_app_state.js` if your JSON keys differ (e.g. `orgId`, `personaId`).
5. After successful dry-run, run in small batches (use `--limit`) and verify counts using queries in `normalized_schema.sql`.
6. After migration, switch app code to read/write normalized tables (dual-read/double-write recommended for cutover).

Rollback & verification
-----------------------
- Keep the original `user_app_state` export; do not delete until verified.
- Verification queries are included in `normalized_schema.sql` and `migrations/cleanup_user_app_state.sql`.

Next actions I will take (automated unless you revoke)
----------------------------------------------------
1. Prepare a PR description and open the PR on GitHub (I have prepared this branch).  
2. If you provide 1-2 representative `user_app_state.state` JSON samples, I will update the ETL mappings and run local dry-runs.  
3. Prepare a step-by-step staging runbook (SQL + commands + verification checklist) and attach to the PR.

If you prefer I can perform the staging runs for you; request temporary read-only DB access and I will proceed.


