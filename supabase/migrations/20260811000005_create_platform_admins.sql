-- ============================================================================
-- REV AI: SEPARATE PLATFORM ADMIN SYSTEM & AUDIT LOGS SCHEMA
-- ============================================================================

-- 1. Create platform_admins table
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_platform_admins_user ON public.platform_admins(user_id);

-- 2. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_user ON public.admin_audit_logs(admin_user_id);

-- 3. Security Definer Helper Function to Check Platform Admin Status
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

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated;

-- 4. Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view platform_admins" ON public.platform_admins;
CREATE POLICY "Platform admins can view platform_admins"
ON public.platform_admins FOR SELECT
USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Platform admins can view audit logs"
ON public.admin_audit_logs FOR SELECT
USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Platform admins can insert audit logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (public.is_platform_admin(auth.uid()));

-- 5. Auto-register existing auth users into platform_admins as ACTIVE
INSERT INTO public.platform_admins (user_id, status)
SELECT id, 'ACTIVE'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
