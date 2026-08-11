const SUPABASE_URL = 'https://nuyszoevzldbtzuydgdp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testExistingRpc() {
  console.log('--- Testing existing create_workspace_owner RPC ---');

  // Test calling create_workspace_owner with p_auth_id, p_email, p_full_name, p_org_name, p_org_industry
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_workspace_owner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      p_auth_id: '00000000-0000-0000-0000-000000000000',
      p_email: 'test@example.com',
      p_full_name: 'Test User',
      p_org_name: 'RPC Test Workspace',
      p_org_industry: 'Technology',
    }),
  });

  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}

testExistingRpc().catch(console.error);
