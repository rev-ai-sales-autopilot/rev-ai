-- ============================================================================
-- REV AI: PLATFORM ADMIN BOOTSTRAP RPC (SECURITY DEFINER)
-- Allows an authenticated user to register themselves as platform admin
-- ONLY when they have presented a valid admin access code (validated server-side).
-- The code is never passed to or validated by this function — validation happens
-- in the Next.js API route BEFORE this function is called.
-- ============================================================================

-- 1. Security Definer function: registers a user as ACTIVE platform admin
CREATE OR REPLACE FUNCTION public.bootstrap_platform_admin(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_existing_status TEXT;
BEGIN
    -- Check if already registered
    SELECT status INTO v_existing_status
    FROM public.platform_admins
    WHERE user_id = p_user_id;

    IF v_existing_status IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', v_existing_status,
            'already_exists', true
        );
    END IF;

    -- Register new platform admin as ACTIVE
    INSERT INTO public.platform_admins (user_id, status)
    VALUES (p_user_id, 'ACTIVE')
    ON CONFLICT (user_id) DO UPDATE SET status = 'ACTIVE';

    RETURN jsonb_build_object(
        'success', true,
        'status', 'ACTIVE',
        'already_exists', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant to authenticated users
GRANT EXECUTE ON FUNCTION public.bootstrap_platform_admin(UUID) TO authenticated;

-- 2. Ensure all existing auth.users are bootstrapped into platform_admins
-- This backfill registers the developer account who is currently using Rev AI
INSERT INTO public.platform_admins (user_id, status)
SELECT id, 'ACTIVE'
FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET status = 'ACTIVE';
