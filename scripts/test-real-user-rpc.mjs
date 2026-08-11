const SUPABASE_URL = 'https://nuyszoevzldbtzuydgdp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkRealUser() {
  // Query auth.users via admin endpoint or users table
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,auth_id,email,full_name&limit=5`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });

  const users = await res.json();
  console.log('Existing users in public.users:', users);

  if (users && users.length > 0) {
    const u = users[0];
    console.log(`\nTesting create_workspace_owner with real auth_id: ${u.auth_id}`);

    const res2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_workspace_owner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        p_auth_id: u.auth_id,
        p_email: u.email,
        p_full_name: u.full_name,
        p_org_name: 'Auto-Provisioned Test Workspace ' + Math.floor(Math.random() * 1000),
        p_org_industry: 'B2B Software & SaaS',
      }),
    });

    console.log('RPC Response Status:', res2.status);
    console.log('RPC Response Body:', await res2.text());
  }
}

checkRealUser().catch(console.error);
