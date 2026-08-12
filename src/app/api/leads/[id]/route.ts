import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { UpdateLeadSchema } from '@/types/lead';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
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

    // 3. Resolve organization membership (Multi-Tenant Protection)
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

    // 4. Query lead by ID scoped to authorized organization
    const { data: rawLead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (fetchError || !rawLead) {
      return NextResponse.json(
        { success: false, error: { code: 'LEAD_NOT_FOUND', message: 'Lead not found or unauthorized' } },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (rawLead as any).metadata || {};
    const lead = {
      ...rawLead,
      name: rawLead.name || meta.name || [rawLead.first_name, rawLead.last_name].filter(Boolean).join(' ') || 'Unnamed Lead',
      company: rawLead.company || rawLead.company_name || meta.company || 'N/A',
      industry: rawLead.industry || meta.industry || 'N/A',
      priority: rawLead.priority || meta.priority || 'NORMAL',
      budget: rawLead.budget !== undefined && rawLead.budget !== null
        ? Number(rawLead.budget)
        : (meta.budget !== undefined && meta.budget !== null ? Number(meta.budget) : null),
      requirement: rawLead.requirement || meta.requirement || rawLead.summary || null,
      message: rawLead.message || meta.message || null,
      ai_classification: rawLead.ai_classification || meta.ai_classification || (rawLead.heat_level !== 'COLD' ? rawLead.heat_level : null),
      ai_score: rawLead.ai_score !== undefined && rawLead.ai_score !== null
        ? rawLead.ai_score
        : (meta.ai_score !== undefined ? meta.ai_score : (rawLead.qualification_score > 0 ? rawLead.qualification_score : null)),
    };

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve lead details';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
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

    // 2. Resolve user profile
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

    // 3. Resolve organization membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
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

    // 4. Fetch existing lead to preserve metadata
    const { data: existingLead, error: fetchErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (fetchErr || !existingLead) {
      return NextResponse.json(
        { success: false, error: { code: 'LEAD_NOT_FOUND', message: 'Lead not found or unauthorized' } },
        { status: 404 }
      );
    }

    // 5. Parse & Validate body with Zod
    const body = await request.json().catch(() => ({}));
    const validationResult = UpdateLeadSchema.safeParse(body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: issues } },
        { status: 400 }
      );
    }

    const input = validationResult.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingMeta = (existingLead as any).metadata || {};

    const updatedMeta = {
      ...existingMeta,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.company !== undefined ? { company: input.company } : {}),
      ...(input.industry !== undefined ? { industry: input.industry } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.budget !== undefined ? { budget: input.budget !== null ? Number(input.budget) : null } : {}),
      ...(input.requirement !== undefined ? { requirement: input.requirement } : {}),
      ...(input.message !== undefined ? { message: input.message } : {}),
    };

    // Construct update payload (protected fields organization_id and created_at cannot be updated)
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      metadata: updatedMeta,
    };

    if (input.name !== undefined) {
      const parts = input.name.trim().split(/\s+/);
      updatePayload.first_name = parts[0] || input.name;
      updatePayload.last_name = parts.slice(1).join(' ') || null;
    }
    if (input.email !== undefined) updatePayload.email = input.email;
    if (input.phone !== undefined) updatePayload.phone = input.phone || null;
    if (input.company !== undefined) updatePayload.company_name = input.company || null;
    if (input.source !== undefined) updatePayload.source = input.source;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.requirement !== undefined || input.message !== undefined) {
      updatePayload.summary = input.requirement || input.message || existingLead.summary || null;
    }

    // Execute update strictly scoped to authorized organization
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', leadId)
      .eq('organization_id', organizationId)
      .select('*')
      .single();

    if (updateError || !updatedLead) {
      console.error('[PATCH /api/leads/[id]] Update error:', updateError);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: updateError?.message || 'Lead update failed' } },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (updatedLead as any).metadata || {};
    const normalizedLead = {
      ...updatedLead,
      name: updatedLead.name || meta.name || [updatedLead.first_name, updatedLead.last_name].filter(Boolean).join(' ') || 'Unnamed Lead',
      company: updatedLead.company || updatedLead.company_name || meta.company || 'N/A',
      industry: updatedLead.industry || meta.industry || 'N/A',
      priority: updatedLead.priority || meta.priority || 'NORMAL',
      budget: updatedLead.budget !== undefined && updatedLead.budget !== null
        ? Number(updatedLead.budget)
        : (meta.budget !== undefined && meta.budget !== null ? Number(meta.budget) : null),
      requirement: updatedLead.requirement || meta.requirement || updatedLead.summary || null,
      message: updatedLead.message || meta.message || null,
    };

    return NextResponse.json({
      success: true,
      lead: normalizedLead,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update lead';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
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

    // 2. Resolve user profile
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

    // 3. Resolve organization membership & role authorization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userProfile.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_WORKSPACE', message: 'Active workspace membership required' } },
        { status: 403 }
      );
    }

    // Check Role Authorization (MEMBER cannot delete leads)
    if (membership.role === 'MEMBER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Role MEMBER does not have permission to delete leads' } },
        { status: 403 }
      );
    }

    const organizationId = membership.organization_id;

    // 4. Delete lead strictly scoped to authorized organization
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('organization_id', organizationId);

    if (deleteError) {
      console.error('[DELETE /api/leads/[id]] Delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: { code: 'DELETE_FAILED', message: deleteError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead permanently deleted',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete lead';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    );
  }
}
