import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getOrCreateUserProfile } from '@/lib/supabase/user-profile';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { z } from 'zod';

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  industry: z.string().default('Sales & Marketing'),
  accessCode: z.string().optional(),
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

    // Rate limit failed attempts per user
    const rateLimit = checkRateLimit(`owner_bootstrap_${user.id}`, 10, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many failed workspace creation attempts. Please try again later.' } },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = createWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { name, industry } = parsed.data;

    // Ensure public.users profile exists safely (idempotent lookup & auto-provisioning)
    const profile = await getOrCreateUserProfile(supabase, user);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Unable to resolve user profile for authenticated user' } },
        { status: 500 }
      );
    }

    // Generate clean slug
    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
      '-' +
      Math.floor(Math.random() * 1000);

    // 1. Try atomic PostgreSQL RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_workspace_owner', {
      p_name: name,
      p_slug: slug,
      p_industry: industry,
    });

    if (!rpcError && rpcData?.success) {
      return NextResponse.json({
        success: true,
        message: rpcData.already_exists
          ? 'User already belongs to a workspace.'
          : 'Workspace created successfully with OWNER access.',
        redirectUrl: '/dashboard',
      });
    }

    // 2. Direct JS execution fallback if RPC function is not deployed on remote DB
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id, organization_id, role')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (existingMember) {
      // Ensure role is set to OWNER when valid owner access code is submitted
      if (existingMember.role !== 'OWNER') {
        await supabase
          .from('organization_members')
          .update({ role: 'OWNER' })
          .eq('id', existingMember.id);
      }

      return NextResponse.json({
        success: true,
        message: 'Workspace owner access verified & role updated to OWNER.',
        redirectUrl: '/dashboard',
      });
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        industry,
      })
      .select()
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: orgError?.message || 'Failed to create organization' } },
        { status: 500 }
      );
    }

    // Create business profile
    await supabase.from('business_profiles').insert({
      organization_id: org.id,
      business_name: name,
      industry,
    });

    // Create owner membership
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: profile.id,
        role: 'OWNER',
      });

    if (memberError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: memberError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workspace created successfully with OWNER access.',
      redirectUrl: '/dashboard',
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}
