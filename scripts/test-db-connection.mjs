import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nuyszoevzldbtzuydgdp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { enabled: false },
});

async function inspectDatabase() {
  console.log('--- Inspecting Supabase Database RPCs & Tables ---');

  // Test 1: Check if create_workspace RPC exists
  const { data: rpcTest, error: rpcError } = await supabase.rpc('create_workspace', {
    p_name: 'Test Org',
    p_industry: 'Technology',
    p_website: 'https://test.com',
    p_description: 'Test'
  });

  console.log('RPC create_workspace result:', { rpcTest, rpcError });

  // Test 2: Check if create_workspace_owner RPC exists
  const { data: rpcOwnerTest, error: rpcOwnerError } = await supabase.rpc('create_workspace_owner', {
    p_name: 'Test Org',
    p_slug: 'test-org-123',
    p_industry: 'Technology'
  });

  console.log('RPC create_workspace_owner result:', { rpcOwnerTest, rpcOwnerError });

  // Test 3: Check tables access with service_role key
  const { data: orgs, error: orgsError } = await supabase.from('organizations').select('id, name, slug').limit(5);
  console.log('Organizations table check:', { orgs, orgsError });

  const { data: members, error: membersError } = await supabase.from('organization_members').select('id, role, organization_id, user_id').limit(5);
  console.log('Organization members check:', { members, membersError });
}

inspectDatabase().catch(console.error);
