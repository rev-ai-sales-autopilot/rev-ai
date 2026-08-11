-- ============================================================================
-- REV AI: COMPLETE MASTER FOUNDATIONAL SCHEMA MIGRATION
-- Run this migration script in the Supabase SQL Editor to provision all missing
-- database tables, indexes, constraints, functions, triggers, and RLS policies.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. USERS PROFILE TABLE (Linked to auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ----------------------------------------------------------------------------
-- 2. ORGANIZATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    industry TEXT,
    website TEXT,
    description TEXT,
    logo_url TEXT,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- ----------------------------------------------------------------------------
-- 3. ORGANIZATION MEMBERS TABLE (RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'SALES', 'MEMBER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

-- ----------------------------------------------------------------------------
-- 4. BUSINESS PROFILES (AI Knowledge Anchor)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    website TEXT,
    business_description TEXT NOT NULL,
    business_email TEXT NOT NULL,
    business_phone TEXT,
    working_hours TEXT,
    payment_terms TEXT,
    refund_policy TEXT,
    service_areas TEXT,
    target_customers TEXT,
    typical_budget TEXT,
    common_requirements TEXT,
    common_questions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_org ON public.business_profiles(organization_id);

-- ----------------------------------------------------------------------------
-- 5. SERVICES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    starting_price TEXT NOT NULL,
    delivery_time TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_org ON public.services(organization_id);

-- ----------------------------------------------------------------------------
-- 6. BUSINESS FAQS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_faqs_org ON public.business_faqs(organization_id);

-- ----------------------------------------------------------------------------
-- 7. LEADS (CRM Core)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    company_name TEXT,
    job_title TEXT,
    source TEXT DEFAULT 'Web Form',
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST')),
    heat_level TEXT NOT NULL DEFAULT 'COLD' CHECK (heat_level IN ('COLD', 'WARM', 'HOT')),
    qualification_score INT DEFAULT 0,
    summary TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_heat ON public.leads(heat_level);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- ----------------------------------------------------------------------------
-- 8. CONVERSATIONS & MESSAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'Web Chat',
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_org ON public.conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON public.conversations(lead_id);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('LEAD', 'AI_AGENT', 'HUMAN_USER')),
    sender_id UUID,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_org ON public.messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id);

-- ----------------------------------------------------------------------------
-- 9. ACTIVITIES, FOLLOWUPS & MEETINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON public.activities(lead_id);

CREATE TABLE IF NOT EXISTS public.followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    channel TEXT NOT NULL DEFAULT 'Email',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'EXECUTED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followups_org ON public.followups(organization_id);
CREATE INDEX IF NOT EXISTS idx_followups_lead ON public.followups(lead_id);

CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    meeting_link TEXT,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_org ON public.meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_meetings_lead ON public.meetings(lead_id);

-- ----------------------------------------------------------------------------
-- 10. AI RUNS & AUTOMATION RUNS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('SUCCESS', 'FAILED', 'RUNNING')),
    error_message TEXT,
    execution_time_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_runs_org ON public.ai_runs(organization_id);

CREATE TABLE IF NOT EXISTS public.automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('SUCCESS', 'FAILED', 'RUNNING')),
    input_payload JSONB DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_org ON public.automation_runs(organization_id);

-- ----------------------------------------------------------------------------
-- 11. INVITATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'SALES', 'MEMBER')),
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- ----------------------------------------------------------------------------
-- 12. WORKFLOW AUTOMATION TABLES
-- ----------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.workflow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
    condition TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- ----------------------------------------------------------------------------
-- 13. PLATFORM ADMIN & AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. HELPER FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------------------

-- Function to get organization IDs for authenticated user
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id IN (
        SELECT id FROM public.users WHERE auth_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Function to check if a user is a platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.platform_admins
        WHERE user_id = p_user_id
          AND status = 'ACTIVE'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to bootstrap a platform admin
CREATE OR REPLACE FUNCTION public.bootstrap_platform_admin(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
    INSERT INTO public.platform_admins (user_id, status)
    VALUES (p_user_id, 'ACTIVE')
    ON CONFLICT (user_id) DO UPDATE SET status = 'ACTIVE';

    RETURN jsonb_build_object('success', true, 'status', 'ACTIVE');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create workspace owner atomically
CREATE OR REPLACE FUNCTION public.create_workspace_owner(
    p_name TEXT,
    p_slug TEXT,
    p_industry TEXT DEFAULT 'Sales & Marketing'
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_existing_org_id UUID;
BEGIN
    -- Resolve public.users.id for authenticated user
    SELECT id INTO v_user_id
    FROM public.users
    WHERE auth_id = auth.uid();

    -- Auto-provision public.users profile if missing
    IF v_user_id IS NULL THEN
        INSERT INTO public.users (auth_id, email, full_name, created_at, updated_at)
        SELECT
            id,
            email,
            COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1)),
            NOW(),
            NOW()
        FROM auth.users
        WHERE id = auth.uid()
        ON CONFLICT (auth_id) DO UPDATE SET email = EXCLUDED.email
        RETURNING id INTO v_user_id;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unable to resolve user profile for authenticated user';
    END IF;

    -- Check if user ALREADY belongs to an organization
    SELECT organization_id INTO v_existing_org_id
    FROM public.organization_members
    WHERE user_id = v_user_id
    LIMIT 1;

    IF v_existing_org_id IS NOT NULL THEN
        -- Promote existing membership to OWNER
        UPDATE public.organization_members
        SET role = 'OWNER', updated_at = NOW()
        WHERE user_id = v_user_id AND organization_id = v_existing_org_id;

        RETURN jsonb_build_object(
            'success', true,
            'already_exists', true,
            'organization_id', v_existing_org_id
        );
    END IF;

    -- Insert organization
    INSERT INTO public.organizations (name, slug, industry)
    VALUES (p_name, p_slug, COALESCE(p_industry, 'Sales & Marketing'))
    RETURNING id INTO v_org_id;

    -- Insert business profile
    INSERT INTO public.business_profiles (organization_id, business_name, industry)
    VALUES (v_org_id, p_name, COALESCE(p_industry, 'Sales & Marketing'))
    ON CONFLICT (organization_id) DO NOTHING;

    -- Insert owner membership
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'OWNER')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'OWNER';

    RETURN jsonb_build_object(
        'success', true,
        'already_exists', false,
        'organization_id', v_org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto user creation upon auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_id, email, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT (auth_id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill all existing auth users into public.users and platform_admins
INSERT INTO public.users (auth_id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1))
FROM auth.users
ON CONFLICT (auth_id) DO NOTHING;

INSERT INTO public.platform_admins (user_id, status)
SELECT id, 'ACTIVE' FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET status = 'ACTIVE';

-- ----------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant Execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_platform_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_workspace_owner(TEXT, TEXT, TEXT) TO authenticated;

-- Policies for public.users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Policies for public.organizations
DROP POLICY IF EXISTS "Users can view their orgs" ON public.organizations;
CREATE POLICY "Users can view their orgs" ON public.organizations FOR SELECT USING (id IN (SELECT public.get_user_org_ids()) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create orgs" ON public.organizations;
CREATE POLICY "Authenticated users can create orgs" ON public.organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Org members can update org" ON public.organizations;
CREATE POLICY "Org members can update org" ON public.organizations FOR UPDATE USING (id IN (SELECT public.get_user_org_ids()));

-- Policies for public.organization_members
DROP POLICY IF EXISTS "Users can view org members" ON public.organization_members;
CREATE POLICY "Users can view org members" ON public.organization_members FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert org membership" ON public.organization_members;
CREATE POLICY "Users can insert org membership" ON public.organization_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for platform_admins
DROP POLICY IF EXISTS "Platform admins viewable" ON public.platform_admins;
CREATE POLICY "Platform admins viewable" ON public.platform_admins FOR SELECT USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users insert platform admin" ON public.platform_admins;
CREATE POLICY "Authenticated users insert platform admin" ON public.platform_admins FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Policies for tenant resources (leads, business_profiles, etc.)
DROP POLICY IF EXISTS "Leads org access" ON public.leads;
CREATE POLICY "Leads org access" ON public.leads FOR ALL USING (organization_id IN (SELECT public.get_user_org_ids()) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Business profiles org access" ON public.business_profiles;
CREATE POLICY "Business profiles org access" ON public.business_profiles FOR ALL USING (organization_id IN (SELECT public.get_user_org_ids()) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Workflows org access" ON public.workflows;
CREATE POLICY "Workflows org access" ON public.workflows FOR ALL USING (organization_id IN (SELECT public.get_user_org_ids()) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Invitations org access" ON public.invitations;
CREATE POLICY "Invitations org access" ON public.invitations FOR ALL USING (organization_id IN (SELECT public.get_user_org_ids()) OR public.is_platform_admin(auth.uid()));
