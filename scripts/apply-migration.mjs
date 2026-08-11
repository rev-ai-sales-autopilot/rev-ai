/**
 * REV AI — Apply Workspace Creation Fix to Supabase
 * 
 * This script reads the definitive migration SQL and applies it directly
 * to the Supabase project using the REST API with the service role key.
 * 
 * Run: node scripts/apply-migration.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────
// These MUST be set. The service role key is required to execute DDL.
// Find it in: Supabase Dashboard → Settings → API → service_role key

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  || 'https://nuyszoevzldbtzuydgdp.supabase.co';

// The service_role key — never expose this to the browser
// Set it via: $env:SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌  ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
  console.error('\n   Get it from: Supabase Dashboard → Settings → API → service_role (secret)');
  console.error('   Then run:');
  console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="sb_secret_YOUR_KEY_HERE"');
  console.error('   node scripts/apply-migration.mjs\n');
  process.exit(1);
}

// ─── Read Migration SQL ───────────────────────────────────────────────────────
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260812000000_definitive_workspace_creation_fix.sql');
let sql;

try {
  sql = readFileSync(migrationPath, 'utf8');
  console.log(`\n📄  Read migration: ${migrationPath}`);
  console.log(`    Size: ${sql.length} bytes\n`);
} catch (err) {
  console.error(`❌  Could not read migration file: ${migrationPath}`);
  console.error(err.message);
  process.exit(1);
}

// ─── Execute via Supabase REST API ───────────────────────────────────────────
async function executeSql(sql) {
  // Try the Management API first (requires service role key)
  const pgrestUrl = `${SUPABASE_URL}/pg/query`;
  
  // Supabase doesn't expose a direct SQL execution endpoint via the anon/service-role REST API.
  // We use the pg/query endpoint which is available on cloud projects.
  // Alternative: use the Supabase client with service role key.
  
  const response = await fetch(pgrestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body}`);
  }

  return await response.json();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('🚀  Applying definitive workspace creation fix to Supabase...\n');
console.log(`   Project URL: ${SUPABASE_URL}\n`);

try {
  const result = await executeSql(sql);
  console.log('✅  Migration applied successfully!');
  console.log('\nResult:', JSON.stringify(result, null, 2));
} catch (err) {
  // The pg/query endpoint may not be available. In that case, print instructions.
  console.error('\n❌  Direct SQL execution failed:', err.message);
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📋  MANUAL ALTERNATIVE:');
  console.error('   1. Open: https://supabase.com/dashboard/project/nuyszoevzldbtzuydgdp/sql/new');
  console.error('   2. Paste the contents of:');
  console.error(`      ${migrationPath}`);
  console.error('   3. Click "Run"');
  console.error('   4. Verify: "REV AI create_workspace RPC: INSTALLED AND VERIFIED SUCCESSFULLY"');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1);
}
