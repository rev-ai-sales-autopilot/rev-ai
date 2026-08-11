import { SupabaseClient, User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { OrgRole } from './permissions';

export interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
}

export interface UserOrgMembership {
  userProfile: UserProfile;
  organizationId: string;
  role: OrgRole;
  orgName: string;
  orgIndustry: string;
}

export type AuthState =
  | { status: 'UNAUTHENTICATED'; user: null; profile: null; membership: null }
  | { status: 'UNAFFILIATED'; user: User; profile: UserProfile; membership: null }
  | { status: 'AUTHORIZED'; user: User; profile: UserProfile; membership: UserOrgMembership };

/**
 * Ensures a public.users profile exists for the authenticated Supabase user.
 * Idempotently handles lookup by auth_id, fallback by email, and auto-provisioning.
 */
export async function getOrCreateUserProfile(
  supabase: SupabaseClient,
  user: User
): Promise<UserProfile | null> {
  if (!user || !user.id) return null;

  // 1. Check by auth_id using maybeSingle (doesn't throw PGRST116)
  const { data: byAuthId } = await supabase
    .from('users')
    .select('id, auth_id, email, full_name')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (byAuthId) {
    return byAuthId as UserProfile;
  }

  const userEmail = user.email || '';
  const fullName =
    user.user_metadata?.full_name ||
    userEmail.split('@')[0] ||
    'User';

  // 2. Check by email if user existed under different/empty auth_id
  if (userEmail) {
    const { data: byEmail } = await supabase
      .from('users')
      .select('id, auth_id, email, full_name')
      .eq('email', userEmail)
      .maybeSingle();

    if (byEmail) {
      // Update auth_id to link properly
      const { data: updated } = await supabase
        .from('users')
        .update({ auth_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', byEmail.id)
        .select('id, auth_id, email, full_name')
        .maybeSingle();

      return (updated as UserProfile) || (byEmail as UserProfile);
    }
  }

  // 3. Upsert profile safely on auth_id conflict
  const { data: newProfile } = await supabase
    .from('users')
    .upsert(
      {
        auth_id: user.id,
        email: userEmail,
        full_name: fullName,
      },
      { onConflict: 'auth_id' }
    )
    .select('id, auth_id, email, full_name')
    .maybeSingle();

  if (newProfile) {
    return newProfile as UserProfile;
  }

  // 4. Retry lookup as ultimate fallback
  const { data: fallbackProfile } = await supabase
    .from('users')
    .select('id, auth_id, email, full_name')
    .eq('auth_id', user.id)
    .maybeSingle();

  return (fallbackProfile as UserProfile) || null;
}

/**
 * Centralized server-side helper to determine current user authentication,
 * public user profile, and organization membership state.
 */
export async function getCurrentAuthState(
  customSupabase?: SupabaseClient
): Promise<AuthState> {
  const supabase = customSupabase || (await createServerSupabaseClient());
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: 'UNAUTHENTICATED', user: null, profile: null, membership: null };
  }

  const profile = await getOrCreateUserProfile(supabase, user);

  if (!profile) {
    // Should never happen with getOrCreateUserProfile auto-provisioning
    return { status: 'UNAUTHENTICATED', user: null, profile: null, membership: null };
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(name, industry)')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (!member) {
    return {
      status: 'UNAFFILIATED',
      user,
      profile,
      membership: null,
    };
  }

  const org = member.organizations as unknown as { name?: string; industry?: string };

  const membership: UserOrgMembership = {
    userProfile: profile,
    organizationId: member.organization_id,
    role: member.role as OrgRole,
    orgName: org?.name || 'Rev AI Workspace',
    orgIndustry: org?.industry || 'Sales Automation',
  };

  return {
    status: 'AUTHORIZED',
    user,
    profile,
    membership,
  };
}
