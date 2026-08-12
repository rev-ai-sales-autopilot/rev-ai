-- ============================================================================
-- REV AI: LEADS MODULE SCHEMA ENHANCEMENT
-- Enhances public.leads with full fields for Sales CRM & AI Intelligence Engine
-- ============================================================================

-- Add new columns safely
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS budget NUMERIC,
  ADD COLUMN IF NOT EXISTS requirement TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS ai_score INT,
  ADD COLUMN IF NOT EXISTS ai_classification TEXT,
  ADD COLUMN IF NOT EXISTS ai_intent TEXT,
  ADD COLUMN IF NOT EXISTS ai_urgency TEXT,
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_recommended_action TEXT,
  ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- Backfill name from first_name / last_name if present
UPDATE public.leads
SET name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Backfill company from company_name if present
UPDATE public.leads
SET company = company_name
WHERE company IS NULL AND company_name IS NOT NULL;

-- Backfill ai_classification from heat_level if present
UPDATE public.leads
SET ai_classification = heat_level
WHERE ai_classification IS NULL AND heat_level IS NOT NULL;

-- Backfill ai_score from qualification_score if present
UPDATE public.leads
SET ai_score = qualification_score
WHERE ai_score IS NULL AND qualification_score > 0;

-- Ensure RLS is enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop stale policies if any
DROP POLICY IF EXISTS "Leads org access" ON public.leads;
DROP POLICY IF EXISTS "Users can view org leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert org leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update org leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete org leads" ON public.leads;

-- SELECT policy: Org members and platform admins
CREATE POLICY "Users can view org leads"
ON public.leads FOR SELECT
USING (
    organization_id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

-- INSERT policy: Org members and platform admins
CREATE POLICY "Users can insert org leads"
ON public.leads FOR INSERT
WITH CHECK (
    organization_id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

-- UPDATE policy: Org members and platform admins
CREATE POLICY "Users can update org leads"
ON public.leads FOR UPDATE
USING (
    organization_id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

-- DELETE policy: Org members (OWNER/ADMIN) and platform admins
CREATE POLICY "Users can delete org leads"
ON public.leads FOR DELETE
USING (
    organization_id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- Indexes for fast filtering & search
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_ai_classification ON public.leads(ai_classification);
CREATE INDEX IF NOT EXISTS idx_leads_ai_score ON public.leads(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
