import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserOrgMembership } from '@/lib/supabase/user-profile';
import { hasPermission } from '@/lib/auth/permissions';
import { z } from 'zod';

const updateWorkflowSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED']).optional(),
  nodes: z.array(
    z.object({
      id: z.string().optional(),
      type: z.enum(['TRIGGER', 'AI', 'CONDITION', 'ACTION', 'DELAY']),
      name: z.string(),
      config: z.record(z.string(), z.unknown()).default({}),
      position_x: z.number().default(0),
      position_y: z.number().default(0),
    })
  ).optional(),
  edges: z.array(
    z.object({
      id: z.string().optional(),
      source_node_id: z.string(),
      target_node_id: z.string(),
      condition: z.string().optional(),
    })
  ).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const membership = await getUserOrgMembership(supabase, user);

    if (!membership || !hasPermission(membership.role, 'workflow.read')) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Read access to workflows is restricted for your role.' } },
        { status: 403 }
      );
    }

    // Fetch workflow (RLS enforces tenant isolation)
    const { data: workflow, error: wfError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (wfError || !workflow) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workflow not found or access denied' } },
        { status: 404 }
      );
    }

    // Fetch nodes
    const { data: nodes } = await supabase
      .from('workflow_nodes')
      .select('*')
      .eq('workflow_id', id)
      .order('position_y', { ascending: true });

    // Fetch edges
    const { data: edges } = await supabase
      .from('workflow_edges')
      .select('*')
      .eq('workflow_id', id);

    // Fetch runs summary
    const { data: runs } = await supabase
      .from('workflow_runs')
      .select('id, status, started_at')
      .eq('workflow_id', id)
      .order('started_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        ...workflow,
        nodes: nodes || [],
        edges: edges || [],
        execution_count: runs?.length || 0,
        last_run_at: runs && runs.length > 0 ? runs[0].started_at : null,
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    const membership = await getUserOrgMembership(supabase, user);

    if (!membership || !hasPermission(membership.role, 'workflow.update')) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Updating workflows requires Owner or Admin permissions.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    // Verify ownership via select (RLS enforced)
    const { data: existingWf } = await supabase
      .from('workflows')
      .select('id, organization_id')
      .eq('id', id)
      .single();

    if (!existingWf) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workflow not found or access denied' } },
        { status: 404 }
      );
    }

    const { name, description, status, nodes, edges } = parsed.data;

    // Update workflow fields if provided
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const { data: updatedWf, error: updateError } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: updateError.message } },
        { status: 500 }
      );
    }

    // If nodes provided, replace / sync nodes
    if (nodes !== undefined) {
      // Delete existing nodes and insert updated list
      await supabase.from('workflow_nodes').delete().eq('workflow_id', id);

      if (nodes.length > 0) {
        const nodesToInsert = nodes.map((n, idx) => ({
          workflow_id: id,
          type: n.type,
          name: n.name,
          config: n.config || {},
          position_x: n.position_x || 100,
          position_y: n.position_y || (idx + 1) * 100,
        }));

        await supabase.from('workflow_nodes').insert(nodesToInsert);
      }
    }

    // If edges provided, sync edges
    if (edges !== undefined) {
      await supabase.from('workflow_edges').delete().eq('workflow_id', id);

      if (edges.length > 0) {
        const edgesToInsert = edges.map((e) => ({
          workflow_id: id,
          source_node_id: e.source_node_id,
          target_node_id: e.target_node_id,
          condition: e.condition || null,
        }));

        await supabase.from('workflow_edges').insert(edgesToInsert);
      }
    }

    return NextResponse.json({ success: true, data: updatedWf });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const membership = await getUserOrgMembership(supabase, user);

    if (!membership || !hasPermission(membership.role, 'workflow.delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Deleting workflows requires Owner or Admin permissions.' } },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: deleteError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}
