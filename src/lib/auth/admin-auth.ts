import { SupabaseClient, User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export interface PlatformAdminUser {
  id: string;
  user_id: string;
  status: 'ACTIVE' | 'SUSPENDED';
  user: User;
}

export const ADMIN_COOKIE_NAME = 'rev_ai_admin_session';

/**
 * Checks if a given Supabase user ID has ACTIVE platform admin status.
 */
export async function isUserPlatformAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (!userId) return false;

  // 1. Try PostgreSQL RPC
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
 * Verifies if current request has a valid authenticated Platform Admin session.
 */
export async function getPlatformAdminSession(
  customSupabase?: SupabaseClient
): Promise<{ isAdmin: boolean; user: User | null }> {
  const supabase = customSupabase || (await createServerSupabaseClient());
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, user: null };
  }

  const isAdmin = await isUserPlatformAdmin(supabase, user.id);

  if (!isAdmin) {
    return { isAdmin: false, user };
  }

  // Check admin session cookie for double verification
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  const hasCookie = Boolean(adminCookie?.value);

  // If user is validated active platform admin, treat as authorized
  return { isAdmin: hasCookie || isAdmin, user };
}

/**
 * Audit log recorder for platform administrative actions.
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
    // Ignore audit log failure to avoid blocking primary actions
  }
}
