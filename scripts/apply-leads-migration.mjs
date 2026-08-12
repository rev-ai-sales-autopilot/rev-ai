import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'nuyszoevzldbtzuydgdp';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
  process.exit(1);
}

const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260812200000_leads_schema_enhancement.sql');
const sql = readFileSync(migrationPath, 'utf8');

async function applyMigration() {
  console.log('🚀 Attempting to apply leads schema migration via Supabase Management API...');
  console.log(`   Project Ref: ${PROJECT_REF}\n`);

  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  console.log('Status:', resp.status);
  const text = await resp.text();
  console.log('Response:', text);
}

applyMigration().catch(console.error);
