import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.log('No DATABASE_URL provided. Skipping direct pg execution.');
  process.exit(0);
}

const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260812200000_leads_schema_enhancement.sql');
const sql = readFileSync(migrationPath, 'utf8');

async function main() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL for leads schema migration!');
    await client.query(sql);
    console.log('SUCCESS: Leads migration executed cleanly!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

main();
