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

    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const status = searchParams.get('status')?.trim() || '';
    const priority = searchParams.get('priority')?.trim() || '';
    const classification = searchParams.get('classification')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // 5. Query leads from Supabase using select('*') with organization isolation
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply native status filter if provided
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    // Fetch raw leads from Supabase
    const { data: rawLeads, error: fetchError } = await query;

    if (fetchError) {
      console.error('[GET /api/leads] Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_FAILED', message: fetchError.message } },
        { status: 500 }
      );
    }

    // 6. Normalize fields gracefully between direct columns and metadata JSONB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let normalizedLeads = (rawLeads || []).map((lead: any) => {
      const meta = lead.metadata || {};
      const name = lead.name || meta.name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unnamed Lead';
      const company = lead.company || lead.company_name || meta.company || 'N/A';
      const industry = lead.industry || meta.industry || 'N/A';
      const leadPriority = lead.priority || meta.priority || 'NORMAL';
      const rawBudget = lead.budget !== undefined && lead.budget !== null ? lead.budget : meta.budget;
      const budget = rawBudget !== undefined && rawBudget !== null && rawBudget !== '' ? Number(rawBudget) : null;
      const requirement = lead.requirement || meta.requirement || lead.summary || null;
      const message = lead.message || meta.message || null;
      
      const ai_classification = lead.ai_classification || meta.ai_classification || (lead.heat_level !== 'COLD' ? lead.heat_level : null);
      const ai_score = lead.ai_score !== undefined && lead.ai_score !== null 
        ? lead.ai_score 
        : (meta.ai_score !== undefined ? meta.ai_score : (lead.qualification_score > 0 ? lead.qualification_score : null));

      return {
        ...lead,
        name,
        company,
        industry,
        priority: leadPriority,
        budget,
        requirement,
        message,
        ai_classification,
        ai_score,
        ai_intent: lead.ai_intent || meta.ai_intent || null,
        ai_urgency: lead.ai_urgency || meta.ai_urgency || null,
        ai_confidence: lead.ai_confidence || meta.ai_confidence || null,
        ai_recommended_action: lead.ai_recommended_action || meta.ai_recommended_action || null,
        ai_analyzed_at: lead.ai_analyzed_at || meta.ai_analyzed_at || null,
      };
    });

    // 7. Apply search filter in memory if provided
    if (search) {
      normalizedLeads = normalizedLeads.filter((l) =>
        l.name.toLowerCase().includes(search) ||
        l.email.toLowerCase().includes(search) ||
        l.company.toLowerCase().includes(search)
      );
    }

    // 8. Apply Priority filter
    if (priority && priority !== 'ALL') {
      normalizedLeads = normalizedLeads.filter((l) => l.priority === priority);
    }

    // 9. Apply AI Classification filter
    if (classification && classification !== 'ALL') {
      if (classification === 'NOT_ANALYZED') {
        normalizedLeads = normalizedLeads.filter((l) => !l.ai_classification && l.ai_score === null);
      } else {
        normalizedLeads = normalizedLeads.filter((l) => l.ai_classification === classification);
      }
    }

    // 10. Apply Sorting
    normalizedLeads.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'ai_score') {
        const scoreA = a.ai_score ?? -1;
        const scoreB = b.ai_score ?? -1;
        comparison = scoreA - scoreB;
      } else if (sortBy === 'priority') {
        const priorityWeight = { HIGH: 3, NORMAL: 2, LOW: 1 };
        const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
        const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
        comparison = weightA - weightB;
      } else {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // 11. Apply Pagination
    const totalCount = normalizedLeads.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedLeads = normalizedLeads.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      leads: paginatedLeads,
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

    // Split name into first_name and last_name for legacy schema compatibility
    const nameParts = input.name.trim().split(/\s+/);
    const firstName = nameParts[0] || input.name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Budget as clean numeric value
    const numericBudget = input.budget !== undefined && input.budget !== null
      ? Number(input.budget)
      : null;

    // 5. Construct insert payload supporting both direct columns and JSONB metadata fallback
    const insertPayload: Record<string, unknown> = {
      organization_id: organizationId,
      first_name: firstName,
      last_name: lastName || null,
      email: input.email || `${input.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@lead.revai`,
      phone: input.phone || null,
      company_name: input.company || null,
      source: input.source || 'Website',
      status: input.status || 'NEW',
      heat_level: 'COLD',
      qualification_score: 0,
      summary: input.requirement || input.message || null,
      metadata: {
        name: input.name.trim(),
        company: input.company || null,
        industry: input.industry || null,
        priority: input.priority || 'NORMAL',
        budget: numericBudget,
        requirement: input.requirement || null,
        message: input.message || null,
      },
    };

    // Try inserting into Supabase
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

    // Normalize returned lead
    const meta = newLead.metadata || {};
    const normalizedLead = {
      ...newLead,
      name: newLead.name || meta.name || input.name.trim(),
      company: newLead.company || newLead.company_name || meta.company || input.company || 'N/A',
      industry: newLead.industry || meta.industry || input.industry || 'N/A',
      priority: newLead.priority || meta.priority || input.priority || 'NORMAL',
      budget: newLead.budget !== undefined && newLead.budget !== null ? Number(newLead.budget) : numericBudget,
      requirement: newLead.requirement || meta.requirement || input.requirement || null,
      message: newLead.message || meta.message || input.message || null,
    };

    // 6. Emit LEAD_CREATED Event over internal event bus
    try {
      await eventDispatcher.dispatch(SystemEventType.LEAD_CREATED, organizationId, {
        leadId: normalizedLead.id,
        name: normalizedLead.name,
        email: normalizedLead.email,
        company: normalizedLead.company,
        source: normalizedLead.source,
        timestamp: new Date().toISOString(),
      });
    } catch (eventErr) {
      console.error('[POST /api/leads] Event dispatch non-blocking error:', eventErr);
    }

    return NextResponse.json({
      success: true,
      lead: normalizedLead,
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
