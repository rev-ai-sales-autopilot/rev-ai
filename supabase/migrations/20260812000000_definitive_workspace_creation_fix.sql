-- ============================================================================
-- REV AI: DEFINITIVE WORKSPACE CREATION FIX
-- Fixes "new row violates row-level security policy for table organizations"
-- 
-- PROBLEM: The organizations table has RLS enabled but no INSERT policy
--          that allows a fresh authenticated user (with no existing membership)
--          to create their first organization.
--
-- SOLUTION:
--   1. Drop ALL existing INSERT policies on organizations/organization_members
--      to eliminate any stale/conflicting policies.
--   2. Create a clean SECURITY DEFINER RPC `create_workspace` that atomically:
--        a. Resolves/provisions the public.users profile
--        b. Inserts the organization
--        c. Inserts the organization_member with role = 'OWNER'
--        d. Returns organization_id on success
--      This function runs as the DB owner and bypasses RLS entirely.
--   3. Keep RLS enabled - organizations are still protected for SELECT/UPDATE/DELETE.
--   4. Grant EXECUTE only to 'authenticated', REVOKE from 'anon'.
--
-- RUN THIS SCRIPT IN: Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure tables exist (idempotent)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

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

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'SALES', 'MEMBER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL DEFAULT '',
    industry TEXT NOT NULL DEFAULT '',
    website TEXT,
    business_description TEXT NOT NULL DEFAULT '',
    business_email TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Enable RLS on all tables (safe to re-run)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: DROP all existing INSERT policies that may be stale/conflicting
-- ============================================================================

-- organizations INSERT policies
DROP POLICY IF EXISTS "Authenticated users can create orgs"           ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can insert organizations"  ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations"                ON public.organizations;
DROP POLICY IF EXISTS "Allow authenticated insert"                    ON public.organizations;
DROP POLICY IF EXISTS "orgs_insert_authenticated"                     ON public.organizations;

-- organization_members INSERT policies
DROP POLICY IF EXISTS "Users can insert org membership"              ON public.organization_members;
DROP POLICY IF EXISTS "Users can insert own org membership"          ON public.organization_members;
DROP POLICY IF EXISTS "Allow authenticated member insert"            ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert_authenticated"             ON public.organization_members;

-- ============================================================================
-- STEP 4: Create SAFE READ policies (for existing org access)
-- ============================================================================

-- Helper: get org IDs for current user (used in SELECT/UPDATE/DELETE policies)
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT om.organization_id
    FROM public.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE u.auth_id = auth.uid();
$$;

-- Helper: check platform admin status
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_auth_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.platform_admins
        WHERE user_id = p_auth_uid AND status = 'ACTIVE'
    );
$$;

-- organizations SELECT policy
DROP POLICY IF EXISTS "Users can view their orgs" ON public.organizations;
CREATE POLICY "Users can view their orgs"
ON public.organizations FOR SELECT
USING (
    id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

-- organizations UPDATE policy
DROP POLICY IF EXISTS "Org members can update org" ON public.organizations;
CREATE POLICY "Org members can update org"
ON public.organizations FOR UPDATE
USING (id IN (SELECT public.get_user_org_ids()));

-- organization_members SELECT policy
DROP POLICY IF EXISTS "Users can view org members" ON public.organization_members;
CREATE POLICY "Users can view org members"
ON public.organization_members FOR SELECT
USING (
    organization_id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

-- business_profiles access policy
DROP POLICY IF EXISTS "Business profiles org access" ON public.business_profiles;
CREATE POLICY "Business profiles org access"
ON public.business_profiles FOR ALL
USING (
    organization_id IN (SELECT public.get_user_org_ids())
    OR public.is_platform_admin(auth.uid())
);

-- users SELECT/UPDATE/INSERT policies
DROP POLICY IF EXISTS "Users can view own profile"   ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth_id = auth.uid());

-- ============================================================================
-- STEP 5: THE CORE FIX — SECURITY DEFINER RPC for atomic workspace creation
--
-- This function:
--   • Runs as the DB owner (SECURITY DEFINER) — bypasses RLS entirely
--   • ALWAYS uses auth.uid() — caller cannot spoof another user
--   • Auto-provisions public.users profile if missing
--   • Atomically creates: organization → organization_members (OWNER) → business_profile
--   • Rolls back everything if any step fails (PostgreSQL implicit transaction)
--   • Returns { success, organization_id, already_exists }
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_workspace(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_workspace(TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_workspace(
    p_name        TEXT,
    p_industry    TEXT    DEFAULT 'Sales & Marketing',
    p_website     TEXT    DEFAULT NULL,
    p_description TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_uid    UUID;
    v_user_id     UUID;
    v_org_id      UUID;
    v_slug        TEXT;
    v_suffix      TEXT;
BEGIN
    -- 1. Get the calling user's auth UID — NEVER trust a parameter
    v_auth_uid := auth.uid();

    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED: auth.uid() is null — user must be signed in';
    END IF;

    -- 2. Validate required input
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'INVALID_INPUT: Organization name is required';
    END IF;

    -- 3. Resolve or provision the public.users profile
    SELECT id INTO v_user_id
    FROM public.users
    WHERE auth_id = v_auth_uid;

    IF v_user_id IS NULL THEN
        -- Auto-provision profile from auth.users metadata
        INSERT INTO public.users (auth_id, email, full_name, created_at, updated_at)
        SELECT
            au.id,
            au.email,
            COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'User'),
            NOW(),
            NOW()
        FROM auth.users au
        WHERE au.id = v_auth_uid
        ON CONFLICT (auth_id) DO UPDATE
            SET email      = EXCLUDED.email,
                updated_at = NOW()
        RETURNING id INTO v_user_id;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'PROFILE_ERROR: Could not resolve or provision user profile for auth.uid() = %', v_auth_uid;
    END IF;

    -- 4. Generate a unique slug from the organization name
    v_suffix := substr(md5(random()::text), 1, 6);
    v_slug   := lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'g'))
                || '-' || v_suffix;
    -- Trim leading/trailing hyphens
    v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');

    -- 5. Insert the organization
    INSERT INTO public.organizations (name, slug, industry, website, description)
    VALUES (
        trim(p_name),
        v_slug,
        COALESCE(trim(p_industry), 'Sales & Marketing'),
        NULLIF(trim(COALESCE(p_website, '')), ''),
        NULLIF(trim(COALESCE(p_description, '')), '')
    )
    RETURNING id INTO v_org_id;

    -- 6. Insert owner membership (role = OWNER, user = auth.uid())
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'OWNER');

    -- 7. Insert default business profile
    INSERT INTO public.business_profiles (
        organization_id,
        business_name,
        industry,
        website,
        business_description,
        business_email
    )
    VALUES (
        v_org_id,
        trim(p_name),
        COALESCE(trim(p_industry), 'Sales & Marketing'),
        NULLIF(trim(COALESCE(p_website, '')), ''),
        COALESCE(NULLIF(trim(COALESCE(p_description, '')), ''), trim(p_name) || ' — AI-powered workspace'),
        (SELECT email FROM auth.users WHERE id = v_auth_uid)
    )
    ON CONFLICT (organization_id) DO NOTHING;

    -- 8. Return success with the new organization ID
    RETURN jsonb_build_object(
        'success',         true,
        'organization_id', v_org_id,
        'user_id',         v_user_id,
        'slug',            v_slug
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Let PostgreSQL roll back the transaction automatically.
        -- Re-raise with context for the caller.
        RAISE EXCEPTION 'WORKSPACE_CREATION_FAILED: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- ============================================================================
-- STEP 6: Permissions — ONLY authenticated users may call create_workspace
-- ============================================================================

REVOKE ALL ON FUNCTION public.create_workspace(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_workspace(TEXT, TEXT, TEXT, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.create_workspace(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Grant helper functions
REVOKE ALL ON FUNCTION public.get_user_org_ids() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;

REVOKE ALL ON FUNCTION public.is_platform_admin(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated;

-- ============================================================================
-- STEP 7: Keep create_workspace_owner for backward compat but point to new fn
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_workspace_owner(
    p_name     TEXT,
    p_slug     TEXT     DEFAULT NULL,
    p_industry TEXT     DEFAULT 'Sales & Marketing'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Delegate entirely to the new create_workspace function
    SELECT public.create_workspace(p_name, p_industry, NULL, NULL)
    INTO v_result;
    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.create_workspace_owner(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_workspace_owner(TEXT, TEXT, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.create_workspace_owner(TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- STEP 8: Verify the setup
-- ============================================================================

DO $$
BEGIN
    -- Verify create_workspace exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'create_workspace'
    ) THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: create_workspace function not found';
    END IF;

    -- Verify organizations RLS is enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'organizations' AND c.relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: organizations RLS is not enabled';
    END IF;

    RAISE NOTICE 'REV AI create_workspace RPC: INSTALLED AND VERIFIED SUCCESSFULLY';
END;
$$;
