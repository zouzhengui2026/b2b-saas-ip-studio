#!/usr/bin/env node
/**
 * Batch migration wrapper.
 * - Connects to DB via DATABASE_URL
 * - Selects user_app_state ids (by updated_at desc) in batches
 * - For each user id spawns ETL process to migrate that single row: node scripts/etl_migrate_user_app_state.js --row-id=<id>
 *
 * Usage:
 *   export DATABASE_URL=... 
 *   node scripts/batch_migrate.js --batch-size=10 --max=100
 */
import { Client } from "pg"
import { spawnSync } from "child_process"

const argv = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k,v] = a.split("="); return [k.replace(/^--/,""), v ?? "true"]
}))
const BATCH_SIZE = parseInt(argv["batch-size"]||"10",10)
const MAX = argv["max"] ? parseInt(argv["max"],10) : null

if (!process.env.DATABASE_URL) {
  console.error("Please set DATABASE_URL")
  process.exit(1)
}

const client = new Client({ connectionString: process.env.DATABASE_URL })

async function fetchUserIds(limit, offset) {
  const res = await client.query(`SELECT id, user_id FROM user_app_state ORDER BY updated_at DESC LIMIT $1 OFFSET $2`, [limit, offset])
  return res.rows
}

async function main() {
  await client.connect()
  let offset = 0
  let migrated = 0
  while (true) {
    const rows = await fetchUserIds(BATCH_SIZE, offset)
    if (!rows.length) break
    for (const r of rows) {
      if (MAX && migrated >= MAX) break
      console.log(`Migrating row id=${r.id} user_id=${r.user_id}`)
      const cmd = "node"
      const args = ["./scripts/etl_migrate_user_app_state.js", `--row-id=${r.id}`]
      const proc = spawnSync(cmd, args, { stdio: "inherit", env: process.env })
      if (proc.status !== 0) {
        console.error("Child process failed for row", r.id, "status", proc.status)
        // decide to continue or abort; we abort to let user inspect
        await client.end()
        process.exit(1)
      }
      migrated++
    }
    if (MAX && migrated >= MAX) break
    offset += BATCH_SIZE
  }
  await client.end()
  console.log("Batch migration complete. migrated=", migrated)
}

main().catch(e => { console.error(e); process.exit(1) })


