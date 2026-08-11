-- ============================================================================
-- REV AI: FIX USER PROFILE CREATION & AUTOMATIC AUTH TRIGGER MIGRATION
-- ============================================================================

-- 1. Ensure public.users table exists with proper schema & constraints
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on auth_id for ultra-fast profile lookup
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- 2. Create Security Definer Trigger Function for Auto Profile Creation
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

-- Drop existing trigger if any and bind to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill existing auth.users who do not have a public.users profile yet
INSERT INTO public.users (auth_id, email, full_name, created_at, updated_at)
SELECT
    id AS auth_id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1)),
    NOW(),
    NOW()
FROM auth.users
ON CONFLICT (auth_id) DO NOTHING;

-- 4. Ensure RLS is enabled on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth_id = auth.uid());
