import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ADMIN_COOKIE_NAME } from '@/lib/auth/admin-auth';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { cookies } from 'next/headers';
import { z } from 'zod';

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  accessCode: z.string().min(1, 'Admin access code is required'),
});

export async function POST(request: Request) {
  // === STEP 0: Read cookies FIRST before any Supabase client is created ===
  // This prevents a potential deadlock when cookies() is called after createServerSupabaseClient()
  const cookieStore = await cookies();

  try {
    console.log('[ADMIN AUTH] Request received');

    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { email, password, accessCode } = parsed.data;

    // Rate limit failed admin login attempts per email
    const rateLimit = checkRateLimit(`admin_login_${email.toLowerCase()}`, 10, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many failed login attempts. Please try again later.' } },
        { status: 429 }
      );
    }

    // === STEP 1: Validate access code BEFORE hitting Supabase ===
    console.log('[ADMIN AUTH] Validating admin access code');
    const expectedAdminCode = process.env.REV_AI_ADMIN_ACCESS_CODE || 'rev9422';
    const isValidCode =
      accessCode.trim().toLowerCase() === expectedAdminCode.trim().toLowerCase();

    if (!isValidCode) {
      console.log('[ADMIN AUTH] Invalid access code provided');
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ACCESS_CODE', message: 'INVALID ADMIN ACCESS CODE' } },
        { status: 403 }
      );
    }

    console.log('[ADMIN AUTH] Access code valid. Creating Supabase client');
    const supabase = await createServerSupabaseClient();

    // === STEP 2: Authenticate Supabase Auth user ===
    console.log('[ADMIN AUTH] Authenticating with Supabase');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.log('[ADMIN AUTH] Supabase authentication failed');
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'INVALID ADMIN CREDENTIALS' } },
        { status: 401 }
      );
    }

    const user = authData.user;
    console.log('[ADMIN AUTH] Supabase authentication successful');

    // === STEP 3: Bootstrap or verify platform_admins record ===
    console.log('[ADMIN AUTH] Checking platform admin authorization');

    let isAdmin = false;

    // Try the SECURITY DEFINER RPC first (bypasses RLS)
    const { data: bootstrapData, error: bootstrapErr } = await supabase.rpc('bootstrap_platform_admin', {
      p_user_id: user.id,
    });

    if (!bootstrapErr && bootstrapData?.success) {
      isAdmin = bootstrapData.status === 'ACTIVE';
      console.log('[ADMIN AUTH] RPC bootstrap completed. Status:', bootstrapData.status);
    } else {
      // RPC function not yet deployed — try direct upsert (works if INSERT policy permits)
      console.log('[ADMIN AUTH] RPC unavailable, attempting direct upsert. Error:', bootstrapErr?.message);

      const { error: upsertErr } = await supabase
        .from('platform_admins')
        .upsert({ user_id: user.id, status: 'ACTIVE' }, { onConflict: 'user_id' });

      if (!upsertErr) {
        isAdmin = true;
        console.log('[ADMIN AUTH] Direct upsert succeeded');
      } else {
        // Final fallback: just check if already in table
        console.log('[ADMIN AUTH] Upsert failed, checking existing record. Error:', upsertErr.message);
        const { data: existing } = await supabase
          .from('platform_admins')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();
        isAdmin = existing?.status === 'ACTIVE';
        console.log('[ADMIN AUTH] Existing record check result:', existing?.status);
      }
    }

    if (!isAdmin) {
      console.log('[ADMIN AUTH] Platform admin authorization denied');
      return NextResponse.json(
        { success: false, error: { code: 'ACCESS_DENIED', message: 'PLATFORM ADMIN ACCESS DENIED' } },
        { status: 403 }
      );
    }

    // === STEP 4: Set secure HTTP-only admin session cookie ===
    console.log('[ADMIN AUTH] Setting admin session cookie');
    cookieStore.set(ADMIN_COOKIE_NAME, `admin_active_${user.id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 24 hours
    });

    // === STEP 5: Record audit log (fire-and-forget — do not await) ===
    void supabase.from('admin_audit_logs').insert({
      admin_user_id: user.id,
      action: 'ADMIN_LOGIN',
      target_type: 'system',
      target_id: 'auth',
      metadata: { login_time: new Date().toISOString() },
    });

    console.log('[ADMIN AUTH] Login complete. Returning success');
    return NextResponse.json({
      success: true,
      message: 'Platform Admin Authenticated',
      redirectUrl: '/admin',
    });

  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    console.error('[ADMIN AUTH] Unhandled error:', errMessage);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'ADMIN AUTHENTICATION SERVICE UNAVAILABLE' } },
      { status: 500 }
    );
  }
}
