import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isUserPlatformAdmin, recordAdminAuditLog, ADMIN_COOKIE_NAME } from '@/lib/auth/admin-auth';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { cookies } from 'next/headers';
import { z } from 'zod';

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  accessCode: z.string().min(1, 'Admin access code is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { email, password, accessCode } = parsed.data;

    // Rate limit failed admin login attempts
    const rateLimit = checkRateLimit(`admin_login_${email.toLowerCase()}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many failed login attempts. Please try again later.' } },
        { status: 429 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // 1. Authenticate Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'INVALID ADMIN CREDENTIALS' } },
        { status: 401 }
      );
    }

    const user = authData.user;

    // 2. Validate server-side admin access code (case-insensitive)
    const expectedAdminCode = process.env.REV_AI_ADMIN_ACCESS_CODE || 'rev9422';
    const isValidCode =
      accessCode.trim().toLowerCase() === expectedAdminCode.trim().toLowerCase();

    if (!isValidCode) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ACCESS_CODE', message: 'INVALID ADMIN ACCESS CODE' } },
        { status: 403 }
      );
    }

    // 3. Verify user is registered in platform_admins with ACTIVE status
    const isAdmin = await isUserPlatformAdmin(supabase, user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'ACCESS_DENIED', message: 'PLATFORM ADMIN ACCESS DENIED' } },
        { status: 403 }
      );
    }

    // 4. Set secure HTTP-only admin session cookie
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, `admin_active_${user.id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 24 hours
    });

    // 5. Record Admin Audit Log
    await recordAdminAuditLog(supabase, user.id, 'ADMIN_LOGIN', 'system', 'auth', {
      email: user.email,
      login_time: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Platform Admin Authenticated',
      redirectUrl: '/admin',
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}
