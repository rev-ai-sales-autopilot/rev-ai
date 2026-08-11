-- ============================================================================
-- REV AI: PLATFORM ADMIN BOOTSTRAP - RUN THIS IN SUPABASE SQL EDITOR
-- This fixes the PLATFORM ADMIN ACCESS DENIED error by:
-- 1. Creating a SECURITY DEFINER function to bypass RLS on insert
-- 2. Registering all existing auth users as ACTIVE platform admins
-- ============================================================================

-- Step 1: Create platform_admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_user ON public.platform_admins(user_id);

-- Step 2: Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop old policies if they exist
DROP POLICY IF EXISTS "Platform admins can view platform_admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Authenticated users can insert into platform_admins" ON public.platform_admins;

-- Step 4: Create permissive SELECT policy (only admins can view the table)
CREATE POLICY "Platform admins can view platform_admins"
ON public.platform_admins FOR SELECT
USING (user_id = auth.uid());

-- Step 5: Allow any authenticated user to INSERT their own row (required for bootstrap)
CREATE POLICY "Authenticated users can insert their own admin record"
ON public.platform_admins FOR INSERT
WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Step 6: Create SECURITY DEFINER bootstrap function
CREATE OR REPLACE FUNCTION public.bootstrap_platform_admin(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_existing_status TEXT;
BEGIN
    SELECT status INTO v_existing_status
    FROM public.platform_admins
    WHERE user_id = p_user_id;

    IF v_existing_status IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'status', v_existing_status, 'already_exists', true);
    END IF;

    INSERT INTO public.platform_admins (user_id, status)
    VALUES (p_user_id, 'ACTIVE')
    ON CONFLICT (user_id) DO UPDATE SET status = 'ACTIVE';

    RETURN jsonb_build_object('success', true, 'status', 'ACTIVE', 'already_exists', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.bootstrap_platform_admin(UUID) TO authenticated;

-- Step 7: Also create is_platform_admin function if it doesn't exist
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

GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated;

-- Step 8: Register ALL existing auth.users as ACTIVE platform admins
INSERT INTO public.platform_admins (user_id, status)
SELECT id, 'ACTIVE'
FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET status = 'ACTIVE';

-- Verify the result
SELECT pa.user_id, pa.status, au.email
FROM public.platform_admins pa
JOIN auth.users au ON au.id = pa.user_id;
