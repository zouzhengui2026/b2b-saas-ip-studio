/**
 * ETL script (draft) to migrate `user_app_state.state` JSONB into normalized tables.
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/etl_migrate_user_app_state.js --dry-run
 *   DATABASE_URL="postgres://..." node scripts/etl_migrate_user_app_state.js --limit=10
 *
 * Notes:
 * - Run in staging first. Always BACKUP `user_app_state` before executing.
 * - The script is intentionally conservative: default is dry-run (no writes).
 * - It processes rows per user in a transaction; inserts orgs/personas/contents and records mappings
 *   from old JSON IDs to new UUIDs to preserve relationships.
 *
 * Environment:
 * - Requires NODE 18+ and npm package `pg` (install with `npm i pg`).
 *
 * Limitations / TODO:
 * - This draft assumes JSON structure keys: state.orgs[], state.personas[], state.contents[].
 * - Adjust field mappings where your JSON differs. Test on a small sample first.
 */

import { Client } from "pg"
import process from "process"
import fs from "fs"

const argv = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.split("=")
    return [k.replace(/^--/, ""), v ?? "true"]
  }),
)

const DRY_RUN = argv["dry-run"] === "true" || argv["dry-run"] === undefined
const LIMIT = argv["limit"] ? parseInt(argv["limit"], 10) : null
const INPUT_FILE = argv["input-file"] || null

if (!process.env.DATABASE_URL && !INPUT_FILE) {
  console.error("ERROR: Please set DATABASE_URL environment variable (Supabase connection string) or pass --input-file for dry-run.")
  process.exit(1)
}

const client = new Client({ connectionString: process.env.DATABASE_URL })

async function ensureExtensions() {
  // Ensure pgcrypto exists for gen_random_uuid() usage in DB migrations (no-op if already present)
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`)
}

async function fetchUserAppStateRows(limit) {
  const q = `
    SELECT id, user_id, updated_at, state
    FROM user_app_state
    ORDER BY updated_at DESC
    ${limit ? `LIMIT ${limit}` : ""}
  `
  const res = await client.query(q)
  return res.rows
}

async function upsertOrg(userId, org) {
  // Try to find existing org by user_id + name to avoid duplicates (tunable)
  const findQ = `SELECT id FROM orgs WHERE user_id = $1 AND name = $2 LIMIT 1`
  const findRes = await client.query(findQ, [userId, org.name ?? ""])
  if (findRes.rows.length > 0) return findRes.rows[0].id

  const insertQ = `
    INSERT INTO orgs (user_id, name, meta, created_at, updated_at)
    VALUES ($1, $2, $3::jsonb, NOW(), NOW())
    RETURNING id
  `
  const res = await client.query(insertQ, [userId, org.name ?? "未命名机构", JSON.stringify(org.meta ?? {})])
  return res.rows[0].id
}

// insert persona, orgId may be null
async function insertPersona(userId, persona, orgId) {
  const insertQ = `
    INSERT INTO personas (org_id, user_id, name, avatar, status, business_stage, meta, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW())
    RETURNING id
  `
  const res = await client.query(insertQ, [
    orgId,
    userId,
    persona.name ?? "未命名IP",
    persona.avatar ?? null,
    persona.status ?? null,
    persona.business_stage ?? null,
    JSON.stringify(persona.meta ?? {}),
  ])
  return res.rows[0].id
}

async function insertContent(userId, content, personaId) {
  const insertQ = `
    INSERT INTO contents (persona_id, user_id, title, body, status, metrics, published_at, created_at, updated_at)
    VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::timestamptz, NOW(), NOW())
    RETURNING id
  `
  const res = await client.query(insertQ, [
    personaId,
    userId,
    content.title ?? null,
    JSON.stringify(content.body ?? content),
    content.status ?? null,
    JSON.stringify(content.metrics ?? {}),
    content.published_at ?? null,
  ])
  return res.rows[0].id
}

async function migrateRow(row, dryRun = true) {
  const userId = row.user_id
  // state may be a JSON string when exported; parse if necessary
  let state = row.state || {}
  if (typeof state === "string") {
    try {
      state = JSON.parse(state)
    } catch (e) {
      console.warn("Warning: failed to parse state JSON for row", row.id, e.message)
      state = {}
    }
  }
  // summary counts
  const orgCount = Array.isArray(state.orgs) ? state.orgs.length : 0
  const personaCount = Array.isArray(state.personas) ? state.personas.length : 0
  const contentCount = Array.isArray(state.contents) ? state.contents.length : 0
  console.log(`\n=== Processing user_id=${userId} (row id=${row.id}) ===`)
  console.log(`summary: orgs=${orgCount}, personas=${personaCount}, contents=${contentCount}`)
  console.log(`\n=== Processing user_id=${userId} (row id=${row.id}) ===`)

  // Mapping oldOrgId -> newOrgId and oldPersonaId -> newPersonaId
  const orgIdMap = new Map()
  const personaIdMap = new Map()

  // Orgs
  const orgs = Array.isArray(state.orgs) ? state.orgs : []
  for (const org of orgs) {
    if (dryRun) {
      console.log(`[dry-run] would upsert org: user=${userId} name=${org.name} oldId=${org.id}`)
      orgIdMap.set(org.id, `__dry_org_${org.id}`)
      continue
    }
    const newOrgId = await upsertOrg(userId, org)
    orgIdMap.set(org.id, newOrgId)
    console.log(`  -> org inserted/upserted id=${newOrgId} (old=${org.id})`)
  }

  // Personas: process all personas and map to new persona ids
  const personas = Array.isArray(state.personas) ? state.personas : []
  for (const persona of personas) {
    const oldOrgKey = persona.orgId ?? persona.orgID ?? persona.org_id ?? null
    const mappedOrgId = orgIdMap.get(oldOrgKey) || null
    if (dryRun) {
      console.log(`[dry-run] would insert persona: ${persona.name} oldId=${persona.id} orgOld=${oldOrgKey} -> orgNew=${mappedOrgId}`)
      personaIdMap.set(persona.id, `__dry_persona_${persona.id}`)
      continue
    }
    const newPersonaId = await insertPersona(userId, persona, mappedOrgId)
    personaIdMap.set(persona.id, newPersonaId)
    console.log(`  -> persona inserted id=${newPersonaId} (old=${persona.id})`)
  }

  // Contents: insert and map persona references
  const contents = Array.isArray(state.contents) ? state.contents : []
  for (const content of contents) {
    const oldPersonaKey = content.personaId ?? content.persona_id ?? content.persona ?? null
    const mappedPersonaId = personaIdMap.get(oldPersonaKey) || null
    if (dryRun) {
      console.log(`[dry-run] would insert content: ${content.title ?? content.id} oldPersona=${oldPersonaKey} -> newPersona=${mappedPersonaId}`)
      continue
    }
    const newContentId = await insertContent(userId, content, mappedPersonaId)
    console.log(`  -> content inserted id=${newContentId} (old=${content.id}) persona_id=${mappedPersonaId}`)
  }

  // If no orgs present, still migrate personas/contents at top-level
  if (orgs.length === 0) {
    // Personas
    const personas = Array.isArray(state.personas) ? state.personas : []
    for (const persona of personas) {
      if (dryRun) {
        console.log(`[dry-run]   would insert persona (no org): ${persona.name}`)
        continue
      }
      // create a default org for user if needed?
      // For now insert persona with null org_id - adjust per business rule
      const newPersonaId = await insertPersona(userId, persona, null).catch(async (e) => {
        // If org_id NOT NULL constraint exists, insert into a fallback org
        console.warn("persona insert failed, inserting into fallback org:", e.message)
        const fallbackOrgId = await upsertOrg(userId, { name: "__fallback__" })
        return insertPersona(userId, persona, fallbackOrgId)
      })
      personaIdMap.set(persona.id ?? persona.oldId ?? JSON.stringify(persona), newPersonaId)
    }

    // Contents
    const contents = Array.isArray(state.contents) ? state.contents : []
    for (const content of contents) {
      if (dryRun) {
        console.log(`[dry-run]   would insert content (no org): ${content.title ?? content.id}`)
        continue
      }
      const oldPersonaKey = content.personaId ?? content.persona_id ?? null
      const newPersonaId = personaIdMap.get(oldPersonaKey) || null
      const newContentId = await insertContent(userId, content, newPersonaId)
      console.log(`    -> content inserted id=${newContentId} (persona_id=${newPersonaId})`)
    }
  }
}

async function main() {
  if (INPUT_FILE) {
    // run dry-run on local input file without connecting to DB
    const raw = fs.readFileSync(INPUT_FILE, "utf8")
    const rows = JSON.parse(raw)
    console.log(`Loaded ${rows.length} rows from input file ${INPUT_FILE}`)
    for (const row of rows) {
      await migrateRow(row, true)
    }
    console.log("Dry-run complete (input-file).")
    return
  }

  await client.connect()
  await ensureExtensions()

  const rows = await fetchUserAppStateRows(LIMIT)
  console.log(`Fetched ${rows.length} user_app_state rows (limit=${LIMIT})`)

  for (const row of rows) {
    try {
      if (DRY_RUN) {
        await migrateRow(row, true)
        continue
      }

      // Wrap per-user migration in a transaction for safety
      await client.query("BEGIN")
      await migrateRow(row, false)
      await client.query("COMMIT")
      console.log(`Committed migration for row id=${row.id}`)
    } catch (err) {
      console.error("Migration failed for row id=", row.id, err)
      try {
        await client.query("ROLLBACK")
      } catch (e) {
        console.error("Failed to rollback transaction", e)
      }
    }
  }

  await client.end()
  console.log("ETL script finished.")
}

main().catch((e) => {
  console.error("Fatal error in ETL script:", e)
  process.exit(1)
})


