import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // Primary check: rev_ai_admin_session cookie (set server-side during login)
    // Cookie value is "admin_active_<user_id>" — verify it matches authenticated user
    const adminCookie = request.cookies.get('rev_ai_admin_session');
    const hasValidAdminCookie =
      adminCookie?.value === `admin_active_${user.id}`;

    if (!hasValidAdminCookie) {
      // Fallback: check platform_admins table (handles session after server restart)
      const { data: adminRecord } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!adminRecord) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }

      // Cookie missing but DB confirms admin — set the cookie on response
      supabaseResponse.cookies.set('rev_ai_admin_session', `admin_active_${user.id}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400,
      });
    }
  }

  // Redirect authenticated platform admins away from /admin/login → /admin
  if (pathname === '/admin/login' && user) {
    const adminCookie = request.cookies.get('rev_ai_admin_session');
    if (adminCookie?.value === `admin_active_${user.id}`) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  // Protect /dashboard and /onboarding routes
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users with NO organization membership away from /dashboard to /workspace-access
  // EXCEPTION: Platform admins bypass ALL organization membership requirements
  if (user && pathname.startsWith('/dashboard')) {
    const adminCookie = request.cookies.get('rev_ai_admin_session');
    const isPlatformAdmin = adminCookie?.value === `admin_active_${user.id}`;

    if (!isPlatformAdmin) {
      // Normal user: enforce org membership
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profile) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (!member) {
          const url = request.nextUrl.clone();
          url.pathname = '/workspace-access';
          return NextResponse.redirect(url);
        }
      } else {
        // Profile not yet created — allow through for auto-provisioning
      }
    }
    // Platform admin: skip org membership check entirely — full access granted
  }

  // Redirect authenticated users away from /auth/login and /auth/signup
  if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
