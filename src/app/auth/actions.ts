'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getOrCreateUserProfile } from '@/lib/supabase/user-profile';
import { redirect } from 'next/navigation';

export async function signUpAction(formData: FormData): Promise<void> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  if (!email || !password || !fullName) {
    return redirect('/auth/signup?error=' + encodeURIComponent('Please provide all required fields.'));
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return redirect('/auth/signup?error=' + encodeURIComponent(error.message));
  }

  if (data.user) {
    try {
      await supabase.from('users').upsert({
        auth_id: data.user.id,
        email: email,
        full_name: fullName,
      });
    } catch {
      // Fallback
    }
  }

  return redirect('/onboarding');
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return redirect('/auth/login?error=' + encodeURIComponent('Email and password are required.'));
  }

  const supabase = await createServerSupabaseClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect('/auth/login?error=' + encodeURIComponent(error.message));
  }

  if (authData.user) {
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authData.user.id)
        .single();

      if (userProfile) {
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userProfile.id);

        if (!memberships || memberships.length === 0) {
          return redirect('/onboarding');
        }
      }
    } catch {
      // Fallback
    }
  }

  return redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return redirect('/auth/login');
}

export async function createOrganizationAction(formData: FormData): Promise<void> {
  const name = (formData.get('name') as string || '').trim();
  const industry = (formData.get('industry') as string || '').trim();
  const website = (formData.get('website') as string || '').trim();
  const description = (formData.get('description') as string || '').trim();

  if (!name || !industry) {
    return redirect('/onboarding?error=' + encodeURIComponent('Organization name and industry are required.'));
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth/login');
  }

  const userProfile = await getOrCreateUserProfile(supabase, user);

  if (!userProfile) {
    return redirect('/onboarding?error=' + encodeURIComponent('Failed to resolve user profile for authenticated user.'));
  }

  const userId = userProfile.id;

  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
    '-' +
    Math.floor(Math.random() * 1000);

  // 1. Try atomic PostgreSQL RPC function (SECURITY DEFINER)
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_workspace_owner', {
    p_name: name,
    p_slug: slug,
    p_industry: industry,
  });

  if (!rpcError && rpcData?.success) {
    return redirect('/dashboard');
  }

  // 2. Direct database execution fallback using maybeSingle() to avoid 0-row exceptions
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id, organization_id, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) {
    if (existingMember.role !== 'OWNER') {
      await supabase
        .from('organization_members')
        .update({ role: 'OWNER' })
        .eq('id', existingMember.id);
    }
    return redirect('/dashboard');
  }

  // Create organization
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      industry,
      website: website || null,
      description: description || null,
    })
    .select('id')
    .single();

  if (orgError || !orgData) {
    return redirect('/onboarding?error=' + encodeURIComponent(orgError?.message || 'WORKSPACE CREATION FAILED'));
  }

  // Create owner membership
  const { error: memberError } = await supabase.from('organization_members').insert({
    organization_id: orgData.id,
    user_id: userId,
    role: 'OWNER',
  });

  if (memberError) {
    return redirect('/onboarding?error=' + encodeURIComponent('OWNER MEMBERSHIP CREATION FAILED: ' + memberError.message));
  }

  // Create default business profile
  await supabase.from('business_profiles').upsert({
    organization_id: orgData.id,
    business_name: name,
    industry: industry,
    website: website || null,
    business_description: description || `${name} provides services in ${industry}.`,
    business_email: user.email || '',
  }, { onConflict: 'organization_id' });

  // Verify membership exists with OWNER role before redirecting
  const { data: verifyMember } = await supabase
    .from('organization_members')
    .select('id, role')
    .eq('organization_id', orgData.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!verifyMember) {
    return redirect('/onboarding?error=' + encodeURIComponent('WORKSPACE CREATED BUT MEMBERSHIP COULD NOT BE VERIFIED'));
  }

  return redirect('/dashboard');
}
