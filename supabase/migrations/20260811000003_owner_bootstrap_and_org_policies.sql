-- ============================================================================
-- REV AI: ATOMIC WORKSPACE CREATION RPC & RLS POLICIES FOR ORGANIZATIONS
-- ============================================================================

-- 1. Ensure business_profiles table exists
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    business_description TEXT,
    business_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Atomic Workspace & Owner Creation Function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_workspace_owner(
    p_name TEXT,
    p_slug TEXT,
    p_industry TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_existing_org_id UUID;
BEGIN
    -- 1. Get public.users.id for current authenticated user
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

    -- 2. Check if user ALREADY belongs to an organization
    SELECT organization_id INTO v_existing_org_id
    FROM public.organization_members
    WHERE user_id = v_user_id
    LIMIT 1;

    IF v_existing_org_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_exists', true,
            'organization_id', v_existing_org_id
        );
    END IF;

    -- 3. Create organization
    INSERT INTO public.organizations (name, slug, industry)
    VALUES (p_name, p_slug, p_industry)
    RETURNING id INTO v_org_id;

    -- 4. Create business profile
    INSERT INTO public.business_profiles (organization_id, business_name, industry)
    VALUES (v_org_id, p_name, p_industry);

    -- 5. Create organization membership with OWNER role
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

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.create_workspace_owner(TEXT, TEXT, TEXT) TO authenticated;

-- 3. Ensure RLS policies on organizations & organization_members
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations FOR SELECT
USING (id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON public.organizations;
CREATE POLICY "Authenticated users can insert organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view members in their orgs" ON public.organization_members;
CREATE POLICY "Users can view members in their orgs"
ON public.organization_members FOR SELECT
USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR
    organization_id IN (SELECT public.get_user_org_ids())
);

DROP POLICY IF EXISTS "Authenticated users can insert membership" ON public.organization_members;
CREATE POLICY "Authenticated users can insert membership"
ON public.organization_members FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
