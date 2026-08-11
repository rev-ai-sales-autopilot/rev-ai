'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
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
  const name        = (formData.get('name')        as string || '').trim();
  const industry    = (formData.get('industry')    as string || '').trim();
  const website     = (formData.get('website')     as string || '').trim();
  const description = (formData.get('description') as string || '').trim();

  if (!name) {
    return redirect('/onboarding?error=' + encodeURIComponent('ORGANIZATION NAME IS REQUIRED'));
  }
  if (!industry) {
    return redirect('/onboarding?error=' + encodeURIComponent('INDUSTRY IS REQUIRED'));
  }

  const supabase = await createServerSupabaseClient();

  // Verify the user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect('/auth/login?error=' + encodeURIComponent('You must be signed in to create a workspace.'));
  }

  // 1. Primary: Call public.create_workspace(p_name, p_industry, p_website, p_description)
  let { data: rpcData, error: rpcError } = await supabase.rpc('create_workspace', {
    p_name:        name,
    p_industry:    industry || 'Sales & Marketing',
    p_website:     website     || null,
    p_description: description || null,
  });

  // 2. Fallback: If create_workspace is not yet in schema cache, call existing create_workspace_owner RPC
  if (rpcError && (rpcError.code === 'PGRST202' || rpcError.message?.includes('Could not find the function'))) {
    console.warn('[createOrganizationAction] create_workspace not found in schema cache. Falling back to create_workspace_owner RPC.');
    
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    const { data: fallbackData, error: fallbackError } = await supabase.rpc('create_workspace_owner', {
      p_auth_id:      user.id,
      p_email:         user.email || '',
      p_full_name:     fullName,
      p_org_name:      name,
      p_org_industry:  industry || 'Sales & Marketing',
    });

    rpcData = fallbackData;
    rpcError = fallbackError;
  }

  if (rpcError) {
    const raw = rpcError.message || 'WORKSPACE CREATION FAILED';
    const userMsg = raw.replace(/^WORKSPACE_CREATION_FAILED:\s*/i, '').replace(/\s*\(SQLSTATE:.*\)$/, '');
    console.error('[createOrganizationAction] RPC error:', rpcError);
    return redirect('/onboarding?error=' + encodeURIComponent(userMsg || 'WORKSPACE CREATION FAILED'));
  }

  if (!rpcData || !rpcData.success) {
    const msg = rpcData?.error || 'WORKSPACE CREATION RETURNED UNEXPECTED RESULT';
    console.error('[createOrganizationAction] RPC returned non-success:', rpcData);
    return redirect('/onboarding?error=' + encodeURIComponent(msg));
  }

  // 3. Success: Redirect to dashboard
  return redirect('/dashboard');
}

