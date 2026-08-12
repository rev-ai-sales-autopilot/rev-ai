-- ============================================================================
-- REV AI: AI RUNS RLS POLICIES & PERMISSIONS
-- Ensures public.ai_runs is fully protected by multi-tenant RLS policies.
-- ============================================================================

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view org ai_runs" ON public.ai_runs;
DROP POLICY IF EXISTS "Users can insert org ai_runs" ON public.ai_runs;

-- SELECT policy: Users can only view AI runs for organizations they belong to
CREATE POLICY "Users can view org ai_runs"
ON public.ai_runs FOR SELECT
USING (
    organization_id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

-- INSERT policy: Authenticated users can insert AI runs for their organization
CREATE POLICY "Users can insert org ai_runs"
ON public.ai_runs FOR INSERT
WITH CHECK (
    organization_id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

-- Grant permissions to authenticated role
GRANT SELECT, INSERT ON public.ai_runs TO authenticated;
