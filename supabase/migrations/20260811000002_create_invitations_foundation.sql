-- ============================================================================
-- REV AI: ORGANIZATION INVITATIONS SCHEMA & RLS POLICIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.org_role NOT NULL DEFAULT 'MEMBER',
    invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.organization_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.organization_invitations(email);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations for their org"
ON public.organization_invitations FOR SELECT
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Owners and admins can insert invitations"
ON public.organization_invitations FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
        AND role IN ('OWNER', 'ADMIN')
    )
);

CREATE POLICY "Owners and admins can update invitations"
ON public.organization_invitations FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
        AND role IN ('OWNER', 'ADMIN')
    )
);
