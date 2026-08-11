-- ============================================================================
-- REV AI PHASE 2 / STEP 1: WORKFLOW AUTOMATION FOUNDATION MIGRATION
-- ============================================================================

-- 1. WORKFLOWS TABLE
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED')),
    version INT NOT NULL DEFAULT 1,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. WORKFLOW NODES TABLE
CREATE TABLE IF NOT EXISTS public.workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('TRIGGER', 'AI', 'CONDITION', 'ACTION', 'DELAY')),
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    position_x FLOAT NOT NULL DEFAULT 0,
    position_y FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WORKFLOW EDGES TABLE
CREATE TABLE IF NOT EXISTS public.workflow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
    condition TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WORKFLOW RUNS TABLE (Execution Audit Foundation)
CREATE TABLE IF NOT EXISTS public.workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    trigger_type TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WORKFLOW RUN STEPS TABLE (Node Level Observability)
CREATE TABLE IF NOT EXISTS public.workflow_run_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    input JSONB DEFAULT '{}'::jsonb,
    output JSONB DEFAULT '{}'::jsonb,
    error TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_workflows_org ON public.workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_wf ON public.workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_wf ON public.workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_org ON public.workflow_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_wf ON public.workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_run_steps_run ON public.workflow_run_steps(workflow_run_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_run_steps ENABLE ROW LEVEL SECURITY;

-- Workflows Policies
CREATE POLICY "Users can view workflows in their org"
ON public.workflows FOR SELECT
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Users can insert workflows in their org"
ON public.workflows FOR INSERT
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Users can update workflows in their org"
ON public.workflows FOR UPDATE
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Users can delete workflows in their org"
ON public.workflows FOR DELETE
USING (organization_id IN (SELECT public.get_user_org_ids()));

-- Workflow Nodes Policies
CREATE POLICY "Users can view nodes for their org workflows"
ON public.workflow_nodes FOR SELECT
USING (workflow_id IN (SELECT id FROM public.workflows WHERE organization_id IN (SELECT public.get_user_org_ids())));

CREATE POLICY "Users can insert nodes for their org workflows"
ON public.workflow_nodes FOR INSERT
WITH CHECK (workflow_id IN (SELECT id FROM public.workflows WHERE organization_id IN (SELECT public.get_user_org_ids())));

CREATE POLICY "Users can update nodes for their org workflows"
ON public.workflow_nodes FOR UPDATE
USING (workflow_id IN (SELECT id FROM public.workflows WHERE organization_id IN (SELECT public.get_user_org_ids())));

CREATE POLICY "Users can delete nodes for their org workflows"
ON public.workflow_nodes FOR DELETE
USING (workflow_id IN (SELECT id FROM public.workflows WHERE organization_id IN (SELECT public.get_user_org_ids())));

-- Workflow Edges Policies
CREATE POLICY "Users can view edges for their org workflows"
ON public.workflow_edges FOR SELECT
USING (workflow_id IN (SELECT id FROM public.workflows WHERE organization_id IN (SELECT public.get_user_org_ids())));

CREATE POLICY "Users can insert edges for their org workflows"
ON public.workflow_edges FOR INSERT
WITH CHECK (workflow_id IN (SELECT id FROM public.workflows WHERE organization_id IN (SELECT public.get_user_org_ids())));

CREATE POLICY "Users can update edges for their org workflows"
ON public.workflow_edges FOR UPDATE
USING (workflow_id IN (SELECT id FROM public.workflows WHERE organization_id IN (SELECT public.get_user_org_ids())));

CREATE POLICY "Users can delete edges for their org workflows"
ON public.workflow_edges FOR DELETE
USING (workflow_id IN (SELECT id FROM public.workflows WHERE organization_id IN (SELECT public.get_user_org_ids())));

-- Workflow Runs Policies
CREATE POLICY "Users can view runs for their org"
ON public.workflow_runs FOR SELECT
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Users can insert runs for their org"
ON public.workflow_runs FOR INSERT
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

-- Workflow Run Steps Policies
CREATE POLICY "Users can view run steps for their org"
ON public.workflow_run_steps FOR SELECT
USING (workflow_run_id IN (SELECT id FROM public.workflow_runs WHERE organization_id IN (SELECT public.get_user_org_ids())));
