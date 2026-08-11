import { SupabaseClient, User } from '@supabase/supabase-js';
import {
  getOrCreateUserProfile as getOrCreateProfileImpl,
  getCurrentAuthState,
  UserProfile,
  UserOrgMembership,
} from '../auth/current-user';
import { OrgRole } from '../auth/permissions';

export type { UserProfile, UserOrgMembership };

export async function getOrCreateUserProfile(
  supabase: SupabaseClient,
  user: User
): Promise<UserProfile | null> {
  return getOrCreateProfileImpl(supabase, user);
}

export async function getUserOrgMembership(
  supabase: SupabaseClient,
  user?: User
): Promise<UserOrgMembership | null> {
  if (user) {
    const profile = await getOrCreateProfileImpl(supabase, user);
    if (!profile) return null;
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(name, industry)')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (!member) return null;
    const org = member.organizations as unknown as { name?: string; industry?: string };
    return {
      userProfile: profile,
      organizationId: member.organization_id,
      role: member.role as OrgRole,
      orgName: org?.name || 'Rev AI Workspace',
      orgIndustry: org?.industry || 'Sales Automation',
    };
  }

  const authState = await getCurrentAuthState(supabase);
  if (authState.status === 'AUTHORIZED') {
    return authState.membership;
  }
  return null;
}
