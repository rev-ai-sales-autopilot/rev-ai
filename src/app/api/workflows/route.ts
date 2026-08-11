import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserOrgMembership } from '@/lib/supabase/user-profile';
import { hasPermission } from '@/lib/auth/permissions';
import { z } from 'zod';

const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  triggerType: z.enum([
    'LEAD_CREATED',
    'LEAD_UPDATED',
    'FORM_SUBMITTED',
    'MESSAGE_RECEIVED',
    'MEETING_COMPLETED',
    'PAYMENT_RECEIVED',
    'WEBHOOK_RECEIVED',
    'SCHEDULED',
  ]).default('LEAD_CREATED'),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const membership = await getUserOrgMembership(supabase, user);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORGANIZATION', message: 'Organization membership required. Please complete onboarding.' } },
        { status: 403 }
      );
    }

    if (!hasPermission(membership.role, 'workflow.read')) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Read access to workflows is restricted for your role.' } },
        { status: 403 }
      );
    }

    // Fetch workflows for user's organization
    const { data: workflows, error: fetchError } = await supabase
      .from('workflows')
      .select(`
        *,
        workflow_nodes (id, type, name),
        workflow_runs (id, status, started_at)
      `)
      .eq('organization_id', membership.organizationId)
      .order('updated_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: fetchError.message } },
        { status: 500 }
      );
    }

    const formattedWorkflows = (workflows || []).map((wf) => {
      const runs = wf.workflow_runs || [];
      const nodes = wf.workflow_nodes || [];
      const triggerNode = nodes.find((n: { type: string }) => n.type === 'TRIGGER');
      return {
        id: wf.id,
        organization_id: wf.organization_id,
        name: wf.name,
        description: wf.description,
        status: wf.status,
        version: wf.version,
        created_at: wf.created_at,
        updated_at: wf.updated_at,
        nodes_count: nodes.length,
        trigger_name: triggerNode?.name || 'Trigger',
        execution_count: runs.length,
        last_run_at: runs.length > 0 ? runs[0].started_at : null,
      };
    });

    return NextResponse.json({ success: true, data: formattedWorkflows });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { name, description, triggerType } = parsed.data;

    const membership = await getUserOrgMembership(supabase, user);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORGANIZATION', message: 'Organization membership required. Please complete onboarding.' } },
        { status: 403 }
      );
    }

    if (!hasPermission(membership.role, 'workflow.create')) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Creating workflows requires Owner or Admin permissions.' } },
        { status: 403 }
      );
    }

    // Insert workflow
    const { data: newWorkflow, error: insertWfError } = await supabase
      .from('workflows')
      .insert({
        organization_id: membership.organizationId,
        name,
        description: description || '',
        status: 'DRAFT',
        created_by: membership.userProfile.id,
      })
      .select()
      .single();

    if (insertWfError || !newWorkflow) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: insertWfError?.message || 'Failed to create workflow' } },
        { status: 500 }
      );
    }

    // Insert default TRIGGER node
    const triggerLabels: Record<string, string> = {
      LEAD_CREATED: 'Lead Created',
      LEAD_UPDATED: 'Lead Updated',
      FORM_SUBMITTED: 'Form Submitted',
      MESSAGE_RECEIVED: 'Message Received',
      MEETING_COMPLETED: 'Meeting Completed',
      PAYMENT_RECEIVED: 'Payment Received',
      WEBHOOK_RECEIVED: 'Webhook Received',
      SCHEDULED: 'Scheduled Event',
    };

    await supabase.from('workflow_nodes').insert({
      workflow_id: newWorkflow.id,
      type: 'TRIGGER',
      name: triggerLabels[triggerType] || 'Trigger',
      config: { triggerType },
      position_x: 100,
      position_y: 100,
    });

    return NextResponse.json({ success: true, data: newWorkflow });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}
