const SUPABASE_URL = 'https://nuyszoevzldbtzuydgdp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function listRpcs() {
  console.log('--- Listing exposed RPC functions ---');
  
  // Fetch OpenAPI schema from Supabase REST API
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Accept': 'application/openapi+json',
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch OpenAPI spec:', res.status, await res.text());
    return;
  }

  const spec = await res.json();
  const rpcs = Object.keys(spec.paths || {}).filter(path => path.startsWith('/rpc/'));
  console.log('Exposed RPC endpoints in Supabase database schema cache:');
  console.log(rpcs.length > 0 ? rpcs : 'NONE (No RPC functions are currently registered in public schema)');
}

listRpcs().catch(console.error);
