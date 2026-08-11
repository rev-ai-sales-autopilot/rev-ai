-- ============================================================================
-- REV AI: FIX WORKSPACE OWNER MEMBERSHIP & BACKFILL FIRST MEMBER TO OWNER
-- ============================================================================

-- 1. Update create_workspace_owner RPC to ensure valid owner bootstrap promotes existing workspace creator to OWNER
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
        -- Promote existing workspace creator to OWNER upon submitting valid bootstrap code
        UPDATE public.organization_members
        SET role = 'OWNER'
        WHERE organization_id = v_existing_org_id AND user_id = v_user_id;

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

-- 2. Backfill existing organization members: Ensure earliest/founder member of each organization has OWNER role
UPDATE public.organization_members
SET role = 'OWNER'
WHERE id IN (
    SELECT om.id
    FROM public.organization_members om
    JOIN (
        SELECT organization_id, MIN(created_at) as min_created
        FROM public.organization_members
        GROUP BY organization_id
    ) earliest ON om.organization_id = earliest.organization_id AND om.created_at = earliest.min_created
);
