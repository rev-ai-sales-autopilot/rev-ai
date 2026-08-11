const SUPABASE_URL = 'https://nuyszoevzldbtzuydgdp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function inspectRpcSpec() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Accept': 'application/openapi+json',
    },
  });

  const spec = await res.json();
  console.log('Path spec for /rpc/create_workspace_owner:');
  console.log(JSON.stringify(spec.paths['/rpc/create_workspace_owner'], null, 2));
}

inspectRpcSpec().catch(console.error);
