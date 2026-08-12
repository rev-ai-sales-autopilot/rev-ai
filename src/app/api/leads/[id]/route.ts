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

    const lead = {
      ...rawLead,
      name: rawLead.name || [rawLead.first_name, rawLead.last_name].filter(Boolean).join(' ') || 'Unnamed Lead',
      company: rawLead.company || rawLead.company_name || 'N/A',
      priority: rawLead.priority || 'NORMAL',
      ai_classification: rawLead.ai_classification || (rawLead.heat_level !== 'COLD' ? rawLead.heat_level : null),
      ai_score: rawLead.ai_score !== undefined && rawLead.ai_score !== null ? rawLead.ai_score : (rawLead.qualification_score > 0 ? rawLead.qualification_score : null),
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

    // 4. Parse & Validate body with Zod
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

    // Construct update payload (protected fields organization_id and created_at cannot be updated)
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) {
      updatePayload.name = input.name.trim();
      const parts = input.name.trim().split(/\s+/);
      updatePayload.first_name = parts[0] || input.name;
      updatePayload.last_name = parts.slice(1).join(' ') || null;
    }
    if (input.email !== undefined) updatePayload.email = input.email;
    if (input.phone !== undefined) updatePayload.phone = input.phone || null;
    if (input.company !== undefined) {
      updatePayload.company = input.company || null;
      updatePayload.company_name = input.company || null;
    }
    if (input.industry !== undefined) updatePayload.industry = input.industry || null;
    if (input.source !== undefined) updatePayload.source = input.source;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.priority !== undefined) updatePayload.priority = input.priority;
    if (input.budget !== undefined) updatePayload.budget = input.budget;
    if (input.requirement !== undefined) updatePayload.requirement = input.requirement || null;
    if (input.message !== undefined) updatePayload.message = input.message || null;

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

    return NextResponse.json({
      success: true,
      lead: updatedLead,
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
