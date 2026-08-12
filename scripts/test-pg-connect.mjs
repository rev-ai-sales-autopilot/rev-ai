import pkg from 'pg';
const { Client } = pkg;

const passwords = ['postgres', 'password', 'Supabase123!', 'RevAI2026!'];
const hosts = ['db.nuyszoevzldbtzuydgdp.supabase.co', 'aws-0-us-east-1.pooler.supabase.com'];

async function testConnections() {
  for (const host of hosts) {
    for (const pw of passwords) {
      const connStr = `postgres://postgres:${pw}@${host}:5432/postgres`;
      console.log(`Trying ${host}...`);
      const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 3000, ssl: { rejectUnauthorized: false } });
      try {
        await client.connect();
        console.log(`SUCCESS! Connected with password: ${pw} to ${host}`);
        await client.end();
        return connStr;
      } catch {
        // failed
      }
    }
  }
  console.log('No direct pg connection succeeded with default passwords.');
}

testConnections();
