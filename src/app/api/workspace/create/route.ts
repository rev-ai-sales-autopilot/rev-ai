import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getOrCreateUserProfile } from '@/lib/supabase/user-profile';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { z } from 'zod';

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  industry: z.string().default('Sales & Marketing'),
  accessCode: z.string().min(1, 'Owner access code is required'),
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
    const rateLimit = checkRateLimit(`owner_bootstrap_${user.id}`, 5, 15 * 60 * 1000);
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

    const { name, industry, accessCode } = parsed.data;

    // Verify user profile
    const profile = await getOrCreateUserProfile(supabase, user);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User profile not found' } },
        { status: 404 }
      );
    }

    // Check if user ALREADY has an organization membership
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', profile.id)
      .single();

    if (existingMember) {
      return NextResponse.json({
        success: true,
        message: 'You already belong to an active workspace.',
        redirectUrl: '/dashboard',
      });
    }

    // Validate server-side owner bootstrap code (case-insensitive)
    const expectedOwnerCode = process.env.REV_AI_OWNER_ACCESS_CODE || 'rev9422';
    const isValidCode =
      accessCode.trim().toLowerCase() === expectedOwnerCode.trim().toLowerCase();

    if (!isValidCode) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ACCESS_CODE', message: 'INVALID OWNER ACCESS CODE' } },
        { status: 400 }
      );
    }

    // Generate clean slug
    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
      '-' +
      Math.floor(Math.random() * 1000);

    // 1. Create organization
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

    // 2. Create business profile
    await supabase.from('business_profiles').insert({
      organization_id: org.id,
      business_name: name,
      industry,
    });

    // 3. Create organization member with OWNER role
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
