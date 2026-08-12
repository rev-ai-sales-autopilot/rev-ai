const SUPABASE_URL = 'https://nuyszoevzldbtzuydgdp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function inspectLeadsTable() {
  console.log('--- Inspecting live Supabase public.leads table ---');

  // Fetch 1 sample row or column information via REST API
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&limit=1`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });

  console.log('GET /rest/v1/leads Status:', res.status);
  const data = await res.json();
  console.log('Sample row / schema response:', data);

  // Fetch OpenAPI spec to get full schema of public.leads
  const specRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Accept': 'application/openapi+json',
    },
  });

  const spec = await specRes.json();
  const leadsDefinition = spec.definitions?.leads;
  console.log('\nOpenAPI Schema Definition for public.leads:');
  console.log(JSON.stringify(leadsDefinition?.properties || {}, null, 2));
}

inspectLeadsTable().catch(console.error);
