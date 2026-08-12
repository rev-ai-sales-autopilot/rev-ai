import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // 2. Resolve User Profile & Workspace Membership
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ success: false, error: 'User profile not resolved' }, { status: 403 });
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userProfile.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ success: false, error: 'Active workspace required' }, { status: 403 });
    }

    const organizationId = membership.organization_id;

    // 3. Seed sample leads into authorized organization
    const sampleLeads = [
      {
        organization_id: organizationId,
        name: 'Rahul Sharma',
        first_name: 'Rahul',
        last_name: 'Sharma',
        email: 'rahul.sharma@technova.io',
        phone: '+91 98765 43210',
        company: 'TechNova Solutions',
        company_name: 'TechNova Solutions',
        industry: 'SaaS',
        source: 'Website',
        status: 'NEW',
        priority: 'HIGH',
        budget: 200000,
        requirement: 'Sales automation & lead scoring',
        message: 'We urgently need to automate our sales qualification workflow.',
      },
      {
        organization_id: organizationId,
        name: 'Aman Khan',
        first_name: 'Aman',
        last_name: 'Khan',
        email: 'aman@growthlabs.co',
        phone: '+91 98123 45678',
        company: 'Growth Labs',
        company_name: 'Growth Labs',
        industry: 'E-commerce',
        source: 'Referral',
        status: 'CONTACTED',
        priority: 'NORMAL',
        budget: 75000,
        requirement: 'CRM & follow-up automation',
        message: 'Looking for an automated solution to follow up with lost website visitors.',
      },
      {
        organization_id: organizationId,
        name: 'Sara Patel',
        first_name: 'Sara',
        last_name: 'Patel',
        email: 'sara.p@alphasystems.com',
        phone: '+91 99887 76655',
        company: 'Alpha Systems',
        company_name: 'Alpha Systems',
        industry: 'Technology',
        source: 'Website',
        status: 'QUALIFIED',
        priority: 'HIGH',
        budget: 350000,
        requirement: 'Complete sales workflow automation',
        message: 'Enterprise inquiry for full sales pipeline automation and WhatsApp integration.',
      },
    ];

    const { data: inserted, error: seedError } = await supabase
      .from('leads')
      .insert(sampleLeads)
      .select('*');

    if (seedError) {
      console.error('[POST /api/leads/seed] Error:', seedError);
      return NextResponse.json({ success: false, error: seedError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${inserted?.length || 0} sample leads`,
      seededLeads: inserted,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Seed failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
