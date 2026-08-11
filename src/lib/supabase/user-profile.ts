import { SupabaseClient, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
}

export interface UserOrgMembership {
  userProfile: UserProfile;
  organizationId: string;
  role: string;
  orgName: string;
  orgIndustry: string;
}

/**
 * Ensures a public.users profile exists for the authenticated Supabase user.
 * If the profile does not exist yet (e.g. created before database trigger),
 * auto-provisions the row cleanly.
 */
export async function getOrCreateUserProfile(
  supabase: SupabaseClient,
  user: User
): Promise<UserProfile | null> {
  // 1. Try querying existing profile by auth_id
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id, auth_id, email, full_name')
    .eq('auth_id', user.id)
    .single();

  if (existingProfile) {
    return existingProfile as UserProfile;
  }

  // 2. Auto-provision profile if missing
  const fullName =
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'User';

  const { data: newProfile, error: insertError } = await supabase
    .from('users')
    .insert({
      auth_id: user.id,
      email: user.email || '',
      full_name: fullName,
    })
    .select('id, auth_id, email, full_name')
    .single();

  if (newProfile && !insertError) {
    return newProfile as UserProfile;
  }

  // 3. Fallback retry query if conflict occurred
  const { data: retryProfile } = await supabase
    .from('users')
    .select('id, auth_id, email, full_name')
    .eq('auth_id', user.id)
    .single();

  return (retryProfile as UserProfile) || null;
}

/**
 * Retrieves the active organization membership details for an authenticated user.
 */
export async function getUserOrgMembership(
  supabase: SupabaseClient,
  user: User
): Promise<UserOrgMembership | null> {
  const profile = await getOrCreateUserProfile(supabase, user);

  if (!profile) {
    return null;
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(name, industry)')
    .eq('user_id', profile.id)
    .single();

  if (!member) {
    return null;
  }

  const org = member.organizations as unknown as { name?: string; industry?: string };

  return {
    userProfile: profile,
    organizationId: member.organization_id,
    role: member.role,
    orgName: org?.name || 'Rev AI Workspace',
    orgIndustry: org?.industry || 'Sales Automation',
  };
}
