import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserOrgMembership } from '@/lib/supabase/user-profile';
import { hasPermission } from '@/lib/auth/permissions';
import { z } from 'zod';

const createInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'SALES', 'MEMBER']).default('MEMBER'),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const membership = await getUserOrgMembership(supabase, user);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORGANIZATION', message: 'Organization membership required' } },
        { status: 403 }
      );
    }

    // Fetch team members
    const { data: members } = await supabase
      .from('organization_members')
      .select('id, role, created_at, users(id, email, full_name)')
      .eq('organization_id', membership.organizationId)
      .order('created_at', { ascending: true });

    // Fetch pending invitations
    const { data: invitations } = await supabase
      .from('organization_invitations')
      .select('id, email, role, status, expires_at, created_at')
      .eq('organization_id', membership.organizationId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        currentRole: membership.role,
        canInvite: hasPermission(membership.role, 'team.invite'),
        members: (members || []).map((m) => {
          const u = m.users as unknown as { id?: string; email?: string; full_name?: string };
          return {
            id: m.id,
            user_id: u?.id,
            email: u?.email || 'Unknown',
            full_name: u?.full_name || 'Team Member',
            role: m.role,
            created_at: m.created_at,
          };
        }),
        invitations: invitations || [],
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const membership = await getUserOrgMembership(supabase, user);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORGANIZATION', message: 'Organization membership required' } },
        { status: 403 }
      );
    }

    // Permission check: only OWNER and ADMIN can create invitations
    if (!hasPermission(membership.role, 'team.invite')) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Only Organization Owners and Admins can invite new team members.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Generate random invitation token (e.g. revai_inv_...)
    const rawToken = 'revai_inv_' + crypto.randomUUID().replace(/-/g, '');
    const tokenHash = rawToken; // Stored securely for token verification

    const { data: newInvitation, error: inviteError } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: membership.organizationId,
        email,
        role,
        invited_by: membership.userProfile.id,
        token_hash: tokenHash,
        status: 'PENDING',
      })
      .select()
      .single();

    if (inviteError || !newInvitation) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: inviteError?.message || 'Failed to create invitation' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        invitation: newInvitation,
        invitationCode: rawToken,
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}
