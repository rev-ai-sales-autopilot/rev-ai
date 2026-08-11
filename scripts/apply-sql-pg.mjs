import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.log('No DATABASE_URL or POSTGRES_URL environment variable provided.');
  console.log('Skipping direct pg execution.');
  process.exit(0);
}

const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260812000000_definitive_workspace_creation_fix.sql');
const sql = readFileSync(migrationPath, 'utf8');

async function main() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL!');
    await client.query(sql);
    console.log('SUCCESS: SQL Migration executed cleanly!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

main();
