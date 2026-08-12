import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CreateLeadSchema } from '@/types/lead';
import { eventDispatcher } from '@/lib/automation/events';
import { SystemEventType } from '@/types/automation';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Resolve user's public profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not resolved' } },
        { status: 403 }
      );
    }

    // 3. Resolve organization membership (Multi-Tenant Security Boundary)
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userProfile.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_WORKSPACE', message: 'Active workspace membership required' } },
        { status: 403 }
      );
    }

    const organizationId = membership.organization_id;

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const priority = searchParams.get('priority')?.trim() || '';
    const classification = searchParams.get('classification')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // 5. Build Supabase query with tenant isolation
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply search filter (name, email, company)
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`
      );
    }

    // Apply Status filter
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    // Apply Priority filter
    if (priority && priority !== 'ALL') {
      query = query.eq('priority', priority);
    }

    // Apply AI Classification filter
    if (classification && classification !== 'ALL') {
      if (classification === 'NOT_ANALYZED') {
        query = query.is('ai_classification', null);
      } else {
        query = query.or(`ai_classification.eq.${classification},heat_level.eq.${classification}`);
      }
    }

    // Apply sorting
    if (sortBy === 'ai_score') {
      query = query.order('ai_score', { ascending: sortOrder === 'asc', nullsFirst: false });
    } else if (sortBy === 'priority') {
      query = query.order('priority', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: rawLeads, count, error: fetchError } = await query;

    if (fetchError) {
      console.error('[GET /api/leads] Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_FAILED', message: fetchError.message } },
        { status: 500 }
      );
    }

    // Normalize fallback fields for table display
    const leads = (rawLeads || []).map((lead) => ({
      ...lead,
      name: lead.name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unnamed Lead',
      company: lead.company || lead.company_name || 'N/A',
      priority: lead.priority || 'NORMAL',
      ai_classification: lead.ai_classification || (lead.heat_level !== 'COLD' ? lead.heat_level : null),
      ai_score: lead.ai_score !== undefined && lead.ai_score !== null ? lead.ai_score : (lead.qualification_score > 0 ? lead.qualification_score : null),
    }));

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      success: true,
      leads,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch leads';
    console.error('[GET /api/leads] Exception:', message);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Resolve user's public profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not resolved' } },
        { status: 403 }
      );
    }

    // 3. Resolve organization membership (Multi-Tenant Security Boundary)
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userProfile.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_WORKSPACE', message: 'Active workspace membership required' } },
        { status: 403 }
      );
    }

    const organizationId = membership.organization_id;

    // 4. Validate input with Zod
    const body = await request.json().catch(() => ({}));
    const validationResult = CreateLeadSchema.safeParse(body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: issues } },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // Split name into first_name and last_name for legacy compatibility
    const nameParts = input.name.trim().split(/\s+/);
    const firstName = nameParts[0] || input.name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // 5. Insert lead into Supabase (organization_id derived from server session)
    const insertPayload = {
      organization_id: organizationId,
      name: input.name.trim(),
      first_name: firstName,
      last_name: lastName || null,
      email: input.email || `${input.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@lead.revai`,
      phone: input.phone || null,
      company: input.company || null,
      company_name: input.company || null,
      industry: input.industry || null,
      source: input.source || 'Website',
      status: input.status || 'NEW',
      priority: input.priority || 'NORMAL',
      budget: input.budget !== undefined ? input.budget : null,
      requirement: input.requirement || null,
      message: input.message || null,
    };

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError || !newLead) {
      console.error('[POST /api/leads] Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: { code: 'INSERT_FAILED', message: insertError?.message || 'Lead insert failed' } },
        { status: 500 }
      );
    }

    // 6. Emit LEAD_CREATED Event over internal event bus
    try {
      await eventDispatcher.dispatch(SystemEventType.LEAD_CREATED, organizationId, {
        leadId: newLead.id,
        name: newLead.name,
        email: newLead.email,
        company: newLead.company,
        source: newLead.source,
        timestamp: new Date().toISOString(),
      });
    } catch (eventErr) {
      console.error('[POST /api/leads] Event dispatch non-blocking error:', eventErr);
    }

    return NextResponse.json({
      success: true,
      lead: newLead,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lead creation failed';
    console.error('[POST /api/leads] Exception:', message);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    );
  }
}
