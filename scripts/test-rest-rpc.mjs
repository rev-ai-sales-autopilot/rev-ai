const SUPABASE_URL = 'https://nuyszoevzldbtzuydgdp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkRpc() {
  console.log('--- Querying Supabase REST API directly via fetch ---');

  // Test 1: Query public.create_workspace via RPC endpoint
  const res1 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      p_name: 'Test Org',
      p_industry: 'Technology',
      p_website: 'https://test.com',
      p_description: 'Test',
    }),
  });

  console.log('POST /rest/v1/rpc/create_workspace status:', res1.status);
  console.log('Response body:', await res1.text());

  // Test 2: Query public.create_workspace_owner via RPC endpoint
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_workspace_owner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      p_name: 'Test Org',
      p_slug: 'test-org-123',
      p_industry: 'Technology',
    }),
  });

  console.log('\nPOST /rest/v1/rpc/create_workspace_owner status:', res2.status);
  console.log('Response body:', await res2.text());

  // Test 3: Query organizations table
  const res3 = await fetch(`${SUPABASE_URL}/rest/v1/organizations?select=id,name,slug&limit=5`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });

  console.log('\nGET /rest/v1/organizations status:', res3.status);
  console.log('Organizations:', await res3.json());
}

checkRpc().catch(console.error);
