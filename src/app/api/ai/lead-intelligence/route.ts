import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { analyzeLeadIntelligence } from '@/lib/ai/agents/lead-intelligence';
import { LeadIntelligenceInputPayload } from '@/lib/ai/schemas/lead-intelligence';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate User
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

    // 2. Resolve public.users profile ID
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

    // 3. Resolve authorized organization membership (Multi-Tenant Protection)
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

    // 4. Parse request body
    const body = await request.json().catch(() => ({}));
    const { leadId, leadData } = body as { leadId?: string; leadData?: LeadIntelligenceInputPayload };

    let activeLeadPayload: LeadIntelligenceInputPayload;

    if (leadId) {
      // Fetch lead from database and verify tenant ownership
      const { data: existingLead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (leadError || !existingLead) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'LEAD_NOT_FOUND',
              message: 'Target lead not found or unauthorized for this workspace',
            },
          },
          { status: 404 }
        );
      }

      activeLeadPayload = {
        name: existingLead.name || existingLead.full_name || 'Lead ' + leadId.slice(0, 6),
        company: existingLead.company || existingLead.company_name || 'N/A',
        industry: existingLead.industry || 'N/A',
        budget: existingLead.budget || 'Not specified',
        requirement: existingLead.requirement || existingLead.notes || 'N/A',
        source: existingLead.source || 'Website',
        message: existingLead.message || existingLead.description || 'N/A',
      };
    } else if (leadData && typeof leadData === 'object') {
      activeLeadPayload = leadData;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Provide either valid leadData object or a valid leadId',
          },
        },
        { status: 400 }
      );
    }

    // 5. Retrieve Organization Business Context (Grounding Context)
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('business_name, industry, target_customers, typical_budget, business_description')
      .eq('organization_id', organizationId)
      .maybeSingle();

    const businessContext = businessProfile
      ? {
          business_name: businessProfile.business_name,
          industry: businessProfile.industry,
          target_customers: businessProfile.target_customers || undefined,
          typical_budget: businessProfile.typical_budget || undefined,
          business_description: businessProfile.business_description,
        }
      : undefined;

    // 6. Execute Lead Intelligence Agent with Qwen 3.5 via Ollama
    const result = await analyzeLeadIntelligence({
      organizationId,
      leadPayload: activeLeadPayload,
      businessContext,
    });

    return NextResponse.json({
      success: true,
      intelligence: result.intelligence,
      runId: result.runId,
      executionTimeMs: result.executionTimeMs,
      agent: 'LEAD_INTELLIGENCE',
      model: process.env.OLLAMA_MODEL || 'qwen3.5:latest',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lead Intelligence AI execution failed';
    console.error('[POST /api/ai/lead-intelligence] Error:', message);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_EXECUTION_FAILED',
          message,
        },
      },
      { status: 500 }
    );
  }
}
