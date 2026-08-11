import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getOrCreateUserProfile } from '@/lib/supabase/user-profile';
import { z } from 'zod';

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
});

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

    const body = await request.json();
    const parsed = acceptInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { token } = parsed.data;

    // Get user profile
    const profile = await getOrCreateUserProfile(supabase, user);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User profile not found' } },
        { status: 404 }
      );
    }

    // Find pending invitation by token hash
    const { data: invitation, error: findError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('token_hash', token)
      .eq('status', 'PENDING')
      .single();

    if (findError || !invitation) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired invitation code.' } },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('organization_invitations')
        .update({ status: 'EXPIRED' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { success: false, error: { code: 'EXPIRED_TOKEN', message: 'This invitation code has expired.' } },
        { status: 400 }
      );
    }

    // Insert organization membership for user with invited role (default MEMBER or as specified)
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert(
        {
          organization_id: invitation.organization_id,
          user_id: profile.id,
          role: invitation.role,
        },
        { onConflict: 'organization_id,user_id' }
      );

    if (memberError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: memberError.message } },
        { status: 500 }
      );
    }

    // Mark invitation as ACCEPTED
    await supabase
      .from('organization_invitations')
      .update({
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully.',
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}
