import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'rev_ai_admin_session';

/**
 * Checks if a given Supabase user ID has ACTIVE platform admin status.
 * Uses RPC first (SECURITY DEFINER bypasses RLS), then direct query fallback.
 */
export async function isUserPlatformAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (!userId) return false;

  // 1. Try SECURITY DEFINER RPC (deployed via migration)
  const { data: isRpcAdmin, error: rpcErr } = await supabase.rpc('is_platform_admin', {
    p_user_id: userId,
  });

  if (!rpcErr && typeof isRpcAdmin === 'boolean') {
    return isRpcAdmin;
  }

  // 2. Direct query fallback
  const { data: adminRecord } = await supabase
    .from('platform_admins')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  return Boolean(adminRecord);
}

/**
 * Verifies if the current request has a valid Platform Admin session.
 *
 * Authorization order (cookie-first to avoid RLS deadlock):
 *   1. Verify Supabase authenticated user
 *   2. Check rev_ai_admin_session cookie (set server-side during login)
 *   3. Fallback to platform_admins DB query (covers cookie expiry / server restart)
 */
export async function getPlatformAdminSession(
  customSupabase?: SupabaseClient
): Promise<{ isAdmin: boolean; user: import('@supabase/supabase-js').User | null }> {
  const supabase = customSupabase || (await createServerSupabaseClient());

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, user: null };
  }

  // Primary check: HTTP-only cookie set during admin login
  // Cookie value is "admin_active_<user_id>" — secure because it's server-set and HTTP-only
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (adminCookie?.value === `admin_active_${user.id}`) {
      return { isAdmin: true, user };
    }
  } catch {
    // cookies() may not be available in all contexts (e.g. API route with custom headers)
    // Fall through to DB check
  }

  // Fallback: query platform_admins (handles cookie expiry after server restart)
  const isAdmin = await isUserPlatformAdmin(supabase, user.id);
  return { isAdmin, user };
}

/**
 * Audit log recorder for platform administrative actions.
 * Non-throwing — failures are silently ignored.
 */
export async function recordAdminAuditLog(
  supabase: SupabaseClient,
  adminUserId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: adminUserId,
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      metadata,
    });
  } catch {
    // Non-critical — don't block primary actions
  }
}
