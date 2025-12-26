/**
 * Database connection diagnostic script for Supabase.
 * This script attempts to connect to the database and provides detailed error information.
 */

import { Client } from "pg"
import process from "process"
import dns from "dns"
import { promisify } from "util"

const resolve4 = promisify(dns.resolve4)
const resolve6 = promisify(dns.resolve6)
const lookup = promisify(dns.lookup)

async function diagnoseConnection() {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error("ERROR: Please set DATABASE_URL environment variable")
    process.exit(1)
  }

  console.log("=== Database Connection Diagnostics ===\n")
  console.log(`Database URL: ${dbUrl.replace(/:[^:]+@/, ':***@')}\n`)

  // Parse connection string
  const url = new URL(dbUrl)
  const host = url.hostname
  const port = url.port || 5432
  const user = url.username
  const password = url.password
  const database = url.pathname.slice(1)
  const sslMode = url.searchParams.get('sslmode') || 'prefer'

  console.log("Connection details:")
  console.log(`  Host: ${host}`)
  console.log(`  Port: ${port}`)
  console.log(`  User: ${user}`)
  console.log(`  Database: ${database}`)
  console.log(`  SSL Mode: ${sslMode}`)
  console.log()

  // Test DNS resolution
  console.log("Testing DNS resolution...")
  try {
    const addresses = await resolve4(host)
    console.log(`✓ IPv4 resolution successful: ${addresses.join(', ')}`)
  } catch (err) {
    console.log(`✗ IPv4 resolution failed: ${err.message}`)
  }

  try {
    const addresses = await resolve6(host)
    console.log(`✓ IPv6 resolution successful: ${addresses.join(', ')}`)
  } catch (err) {
    console.log(`✗ IPv6 resolution failed: ${err.message}`)
  }

  console.log()

  // Test basic connectivity
  console.log("Testing database connection...")
  const client = new Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    // Force IPv4 family for now
    family: 4,
  })

  // Also try with IPv6 forced
  const clientIPv6 = new Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    family: 6,
  })

  let connected = false

  // Test IPv4 connection
  console.log("Testing IPv4 connection...")
  try {
    await client.connect()
    console.log("✓ IPv4 connection successful!")
    connected = true

    // Test a simple query
    console.log("Testing simple query...")
    const result = await client.query('SELECT version()')
    console.log("✓ Query successful!")
    console.log(`  PostgreSQL version: ${result.rows[0].version.split(' ')[1]}`)

    // Test if our tables exist
    console.log("Checking for user_app_state table...")
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'user_app_state'
      );
    `)

    if (tableResult.rows[0].exists) {
      console.log("✓ user_app_state table exists")

      // Count rows
      const countResult = await client.query('SELECT COUNT(*) FROM user_app_state')
      console.log(`✓ user_app_state has ${countResult.rows[0].count} rows`)
    } else {
      console.log("✗ user_app_state table does not exist")
    }

  } catch (err) {
    console.log(`✗ IPv4 connection failed: ${err.message}`)
    console.log(`  Error code: ${err.code || 'N/A'}`)

    // Now try IPv6
    console.log("\nTesting IPv6 connection...")
    try {
      await clientIPv6.connect()
      console.log("✓ IPv6 connection successful!")
      connected = true

      // Test a simple query
      const result = await clientIPv6.query('SELECT version()')
      console.log("✓ IPv6 query successful!")
      console.log(`  PostgreSQL version: ${result.rows[0].version.split(' ')[1]}`)

      // Test if our tables exist
      const tableResult = await clientIPv6.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'user_app_state'
        );
      `)

      if (tableResult.rows[0].exists) {
        console.log("✓ user_app_state table exists")

        // Count rows
        const countResult = await clientIPv6.query('SELECT COUNT(*) FROM user_app_state')
        console.log(`✓ user_app_state has ${countResult.rows[0].count} rows`)
      } else {
        console.log("✗ user_app_state table does not exist")
      }

    } catch (ipv6Err) {
      console.log(`✗ IPv6 connection also failed: ${ipv6Err.message}`)
      console.log(`  Error code: ${ipv6Err.code || 'N/A'}`)

      // Additional diagnostics for common errors
      if (err.code === 'ENOTFOUND' || ipv6Err.code === 'ENOTFOUND') {
        console.log("\nPossible causes for ENOTFOUND:")
        console.log("- DNS resolution issue")
        console.log("- Hostname is incorrect")
        console.log("- Network firewall blocking DNS")
        console.log("- Your network may not support IPv4/IPv6 connections to Supabase")
      } else if (err.code === 'ECONNRESET' || ipv6Err.code === 'ECONNRESET') {
        console.log("\nPossible causes for ECONNRESET:")
        console.log("- Connection reset by server")
        console.log("- SSL/TLS handshake failure")
        console.log("- Network firewall blocking connection")
        console.log("- Supabase IP restrictions")
        console.log("- Incorrect password")
      } else if (err.code === '28P01') {
        console.log("\nAuthentication failed - check username/password")
      } else if (err.code === '3D000') {
        console.log("\nDatabase does not exist")
      }

      console.log("\nTroubleshooting steps:")
      console.log("1. Try connecting from a different network (mobile hotspot, VPN)")
      console.log("2. Check if your firewall/antivirus is blocking connections")
      console.log("3. Verify Supabase database settings allow your IP")
      console.log("4. Double-check the password and connection string")
    }
  } finally {
    if (connected) {
      if (client._connected) {
        await client.end()
      }
      if (clientIPv6._connected) {
        await clientIPv6.end()
      }
      console.log("✓ Disconnected successfully")
    }
  }

  console.log("\n=== Diagnostics Complete ===")
}

diagnoseConnection().catch(err => {
  console.error("Unexpected error during diagnostics:", err)
  process.exit(1)
})
