# 💾 Rev AI Database Specification & Schema

> **Engine:** Supabase PostgreSQL  
> **Security:** Enforced Row-Level Security (RLS) on all tenant-scoped tables.

---

## 1. Overview & Multi-Tenant Model

The Rev AI database uses PostgreSQL extension `uuid-ossp` or native `gen_random_uuid()` for primary keys. Multi-tenancy is guaranteed by attaching an `organization_id` column to all business resources and restricting access using Supabase RLS helper functions.

---

## 2. PostgreSQL DDL Schema

```sql
-- Enable Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS PROFILE TABLE (Linked to auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. ORGANIZATIONS TABLE
-- ============================================================================
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

-- ============================================================================
-- 3. ORGANIZATION MEMBERS (RBAC)
-- ============================================================================
CREATE TYPE public.org_role AS ENUM ('OWNER', 'ADMIN', 'SALES', 'MEMBER');

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role public.org_role NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- 4. BUSINESS PROFILES (AI Knowledge Anchor)
-- ============================================================================
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

-- ============================================================================
-- 5. SERVICES
-- ============================================================================
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

-- ============================================================================
-- 6. BUSINESS FAQS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. LEADS (CRM Core)
-- ============================================================================
CREATE TYPE public.lead_heat AS ENUM ('COLD', 'WARM', 'HOT');
CREATE TYPE public.lead_status AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST');

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
    status public.lead_status NOT NULL DEFAULT 'NEW',
    heat_level public.lead_heat NOT NULL DEFAULT 'COLD',
    qualification_score INT DEFAULT 0,
    summary TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. CONVERSATIONS & MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'Web Chat',
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL, -- 'LEAD' | 'AI_AGENT' | 'HUMAN_USER'
    sender_id UUID,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. ACTIVITIES, FOLLOWUPS & MEETINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g. 'SCORE_UPDATED', 'EMAIL_SENT', 'NOTE_ADDED'
    title TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    channel TEXT NOT NULL DEFAULT 'Email',
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'EXECUTED', 'CANCELLED'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    meeting_link TEXT,
    status TEXT NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. AI RUNS (AI Observability & Cost Auditing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL, -- 'LEAD_INTELLIGENCE' | 'SALES_AGENT' | 'FOLLOWUP_AGENT' | 'SALES_ANALYST'
    model TEXT NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    input_payload JSONB NOT NULL,
    output_payload JSONB,
    status TEXT NOT NULL DEFAULT 'RUNNING', -- 'SUCCESS' | 'FAILED' | 'RUNNING'
    error_message TEXT,
    execution_time_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. AUTOMATION RUNS (n8n & Webhook Execution Monitoring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RUNNING', -- 'SUCCESS' | 'FAILED' | 'RUNNING'
    input_payload JSONB DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

---

## 3. Indexes & Constraints

```sql
-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_heat ON public.leads(heat_level);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_org ON public.ai_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_org ON public.automation_runs(organization_id);
```

---

## 4. Row Level Security (RLS) Helper & Policies

```sql
-- Security Definer helper function to get org IDs for current authenticated user
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS on all tenant tables
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

-- Example RLS Policy Pattern (Applied to all tenant resources)
CREATE POLICY "Users can view data in their orgs"
ON public.leads FOR SELECT
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Users can insert data in their orgs"
ON public.leads FOR INSERT
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Users can update data in their orgs"
ON public.leads FOR UPDATE
USING (organization_id IN (SELECT public.get_user_org_ids()));
```
