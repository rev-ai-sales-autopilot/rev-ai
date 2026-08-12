// Apply ai_runs RLS policies to the live Supabase project
// Run this in: https://supabase.com/dashboard/project/nuyszoevzldbtzuydgdp/sql/new

const SUPABASE_URL = 'https://nuyszoevzldbtzuydgdp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SQL = `
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org ai_runs" ON public.ai_runs;
DROP POLICY IF EXISTS "Users can insert org ai_runs" ON public.ai_runs;

CREATE POLICY "Users can view org ai_runs"
ON public.ai_runs FOR SELECT
USING (
    organization_id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

CREATE POLICY "Users can insert org ai_runs"
ON public.ai_runs FOR INSERT
WITH CHECK (
    organization_id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

GRANT SELECT, INSERT ON public.ai_runs TO authenticated;

DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_runs' AND policyname = 'Users can view org ai_runs'
  ) THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: ai_runs RLS SELECT policy not found';
  END IF;
  RAISE NOTICE 'SUCCESS: ai_runs RLS policies installed and verified.';
END;
$verify$;
`;

async function apply() {
  if (!SERVICE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY env variable');
    process.exit(1);
  }
  // Try REST RPC
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql: SQL }),
  });
  console.log('Status:', res.status, await res.text());
}

apply().catch(console.error);
