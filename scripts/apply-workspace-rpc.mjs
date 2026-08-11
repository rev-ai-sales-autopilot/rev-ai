/**
 * REV AI — Apply create_workspace RPC to Supabase
 *
 * This script applies the create_workspace SECURITY DEFINER function
 * directly to the Supabase cloud database using the Management API.
 *
 * USAGE:
 *   1. Get your service_role key from:
 *      https://supabase.com/dashboard/project/nuyszoevzldbtzuydgdp/settings/api
 *      (It starts with eyJh... and is labeled "service_role")
 *
 *   2. Run ONE of these in PowerShell:
 *
 *      $env:SUPABASE_SERVICE_ROLE_KEY="eyJh...YOUR_KEY..."
 *      node scripts/apply-workspace-rpc.mjs
 *
 * DO NOT commit the service_role key to git.
 */

const SUPABASE_URL = 'https://nuyszoevzldbtzuydgdp.supabase.co';
const PROJECT_REF  = 'nuyszoevzldbtzuydgdp';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('\n╔══════════════════════════════════════════════════════════╗');
  console.error('║  ERROR: SUPABASE_SERVICE_ROLE_KEY is not set             ║');
  console.error('╚══════════════════════════════════════════════════════════╝\n');
  console.error('Get your service_role key from:');
  console.error('  https://supabase.com/dashboard/project/nuyszoevzldbtzuydgdp/settings/api\n');
  console.error('Then run:');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="eyJh...YOUR_KEY..."');
  console.error('  node scripts/apply-workspace-rpc.mjs\n');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// The exact SQL to apply — minimal, focused only on create_workspace RPC
// ─────────────────────────────────────────────────────────────────────────────
const SQL = `
-- ============================================================
-- REV AI: create_workspace SECURITY DEFINER RPC
-- Applied by: scripts/apply-workspace-rpc.mjs
-- ============================================================

-- Ensure tables exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old / conflicting insert policies
DROP POLICY IF EXISTS "Authenticated users can create orgs"           ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can insert organizations"  ON public.organizations;
DROP POLICY IF EXISTS "Users can insert org membership"               ON public.organization_members;
DROP POLICY IF EXISTS "Users can insert own org membership"           ON public.organization_members;

-- Helper: get org IDs for current user
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
    SELECT om.organization_id
    FROM public.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE u.auth_id = auth.uid();
$$;

-- Helper: platform admin check
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_auth_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.platform_admins
        WHERE user_id = p_auth_uid AND status = 'ACTIVE'
    );
$$;

-- Organizations: SELECT only for org members
DROP POLICY IF EXISTS "Users can view their orgs" ON public.organizations;
CREATE POLICY "Users can view their orgs"
ON public.organizations FOR SELECT
USING (id IN (SELECT public.get_user_org_ids()) OR public.is_platform_admin(auth.uid()));

-- Organizations: UPDATE only for org members
DROP POLICY IF EXISTS "Org members can update org" ON public.organizations;
CREATE POLICY "Org members can update org"
ON public.organizations FOR UPDATE
USING (id IN (SELECT public.get_user_org_ids()));

-- Organization members: SELECT for org members
DROP POLICY IF EXISTS "Users can view org members" ON public.organization_members;
CREATE POLICY "Users can view org members"
ON public.organization_members FOR SELECT
USING (organization_id IN (SELECT public.get_user_org_ids()) OR public.is_platform_admin(auth.uid()));

-- Users: own profile access
DROP POLICY IF EXISTS "Users can view own profile"   ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can view own profile"   ON public.users FOR SELECT  USING (auth_id = auth.uid() OR public.is_platform_admin(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE  USING (auth_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT  WITH CHECK (auth_id = auth.uid());

-- Business profiles
DROP POLICY IF EXISTS "Business profiles org access" ON public.business_profiles;
CREATE POLICY "Business profiles org access"
ON public.business_profiles FOR ALL
USING (organization_id IN (SELECT public.get_user_org_ids()) OR public.is_platform_admin(auth.uid()));

-- ============================================================
-- THE CORE FIX: create_workspace SECURITY DEFINER RPC
-- ============================================================
DROP FUNCTION IF EXISTS public.create_workspace(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_workspace(
    p_name        TEXT,
    p_industry    TEXT DEFAULT 'Sales & Marketing',
    p_website     TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_uid UUID;
    v_user_id  UUID;
    v_org_id   UUID;
    v_slug     TEXT;
BEGIN
    -- Always resolve caller from auth.uid() — never trust a parameter
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED: You must be signed in to create a workspace';
    END IF;

    -- Validate name
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'INVALID_INPUT: Organization name is required';
    END IF;

    -- Resolve or auto-provision public.users profile
    SELECT id INTO v_user_id FROM public.users WHERE auth_id = v_auth_uid;
    IF v_user_id IS NULL THEN
        INSERT INTO public.users (auth_id, email, full_name, created_at, updated_at)
        SELECT
            au.id,
            au.email,
            COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'User'),
            NOW(), NOW()
        FROM auth.users au WHERE au.id = v_auth_uid
        ON CONFLICT (auth_id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW()
        RETURNING id INTO v_user_id;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'PROFILE_ERROR: Could not provision user profile for uid=%', v_auth_uid;
    END IF;

    -- Generate unique slug
    v_slug := lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'g'))
              || '-' || substr(md5(random()::text), 1, 6);
    v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');

    -- Insert organization (SECURITY DEFINER bypasses RLS)
    INSERT INTO public.organizations (name, slug, industry, website, description)
    VALUES (
        trim(p_name),
        v_slug,
        COALESCE(NULLIF(trim(COALESCE(p_industry,'')), ''), 'Sales & Marketing'),
        NULLIF(trim(COALESCE(p_website,'')), ''),
        NULLIF(trim(COALESCE(p_description,'')), '')
    )
    RETURNING id INTO v_org_id;

    -- Insert owner membership (atomic — rolls back with org if it fails)
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'OWNER');

    -- Insert default business profile
    INSERT INTO public.business_profiles (
        organization_id, business_name, industry, website, business_description, business_email
    )
    VALUES (
        v_org_id,
        trim(p_name),
        COALESCE(NULLIF(trim(COALESCE(p_industry,'')), ''), 'Sales & Marketing'),
        NULLIF(trim(COALESCE(p_website,'')), ''),
        COALESCE(NULLIF(trim(COALESCE(p_description,'')), ''), trim(p_name) || ' — AI workspace'),
        (SELECT email FROM auth.users WHERE id = v_auth_uid)
    )
    ON CONFLICT (organization_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success',         true,
        'organization_id', v_org_id,
        'user_id',         v_user_id,
        'slug',            v_slug
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'WORKSPACE_CREATION_FAILED: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Permissions
REVOKE ALL  ON FUNCTION public.create_workspace(TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
REVOKE ALL  ON FUNCTION public.create_workspace(TEXT,TEXT,TEXT,TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_workspace(TEXT,TEXT,TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated;

-- Backward compat alias
CREATE OR REPLACE FUNCTION public.create_workspace_owner(
    p_name TEXT, p_slug TEXT DEFAULT NULL, p_industry TEXT DEFAULT 'Sales & Marketing'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    RETURN public.create_workspace(p_name, p_industry, NULL, NULL);
END;
$$;
REVOKE ALL  ON FUNCTION public.create_workspace_owner(TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_workspace_owner(TEXT,TEXT,TEXT) TO authenticated;

-- Verify
DO $verify$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'create_workspace'
    ) THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: create_workspace not found after migration';
    END IF;
    RAISE NOTICE 'SUCCESS: public.create_workspace is installed and verified.';
END;
$verify$;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Apply via Supabase Management API
// ─────────────────────────────────────────────────────────────────────────────
async function applyViaMgmtApi() {
  console.log('\n📡  Attempting Supabase Management API...');
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (resp.ok) {
    const data = await resp.json();
    return { success: true, data };
  }
  const text = await resp.text();
  return { success: false, status: resp.status, body: text };
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply via PostgREST service-role direct SQL (pg endpoint)
// ─────────────────────────────────────────────────────────────────────────────
async function applyViaPostgREST() {
  console.log('\n📡  Attempting PostgREST pg/query endpoint...');
  const url = `${SUPABASE_URL}/pg/query`;
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (resp.ok) {
    const data = await resp.json();
    return { success: true, data };
  }
  const text = await resp.text();
  return { success: false, status: resp.status, body: text };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🚀  REV AI — Applying create_workspace RPC to Supabase');
console.log(`    Project: ${PROJECT_REF}`);
console.log(`    SQL length: ${SQL.length} bytes\n`);

let result = await applyViaMgmtApi();

if (!result.success) {
  console.log(`    Management API failed (${result.status}): ${result.body?.slice(0, 200)}`);
  result = await applyViaPostgREST();
}

if (result.success) {
  console.log('\n✅  Migration applied successfully!');
  if (result.data) console.log('    Result:', JSON.stringify(result.data).slice(0, 300));
  console.log('\n📋  Now test the flow at: http://localhost:3000/onboarding\n');
} else {
  console.error('\n❌  Both API methods failed.');
  console.error(`    Last error (${result.status}): ${result.body?.slice(0, 500)}\n`);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📋  MANUAL STEPS (guaranteed to work):');
  console.error('    1. Open: https://supabase.com/dashboard/project/nuyszoevzldbtzuydgdp/sql/new');
  console.error('    2. Copy the SQL from: supabase/migrations/20260812000000_definitive_workspace_creation_fix.sql');
  console.error('    3. Paste it into the SQL editor and click RUN');
  console.error('    4. You should see: "SUCCESS: public.create_workspace is installed and verified."');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1);
}
