-- ============================================================================
-- REV AI: FIX ORGANIZATION CREATION RLS & ATOMIC RPC
-- Allows authenticated users to safely create a new workspace & owner membership
-- ============================================================================

-- 1. Ensure organizations RLS insert policy allows authenticated users
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can create orgs" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON public.organizations;

CREATE POLICY "Authenticated users can insert organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Ensure organization_members RLS insert policy allows users to insert their own membership
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert org membership" ON public.organization_members;
DROP POLICY IF EXISTS "Users can insert own org membership" ON public.organization_members;

CREATE POLICY "Users can insert own org membership"
ON public.organization_members FOR INSERT
WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- 3. Atomic SECURITY DEFINER RPC function for Workspace & Owner creation
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

GRANT EXECUTE ON FUNCTION public.create_workspace_owner(TEXT, TEXT, TEXT) TO authenticated;
