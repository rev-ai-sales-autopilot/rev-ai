import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPlatformAdminSession } from '@/lib/auth/admin-auth';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { isAdmin } = await getPlatformAdminSession(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PLATFORM ADMIN ACCESS DENIED' } },
        { status: 403 }
      );
    }

    // Platform-wide counts
    const { count: orgsCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: workflowsCount } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    const { count: runsCount } = await supabase
      .from('workflow_runs')
      .select('*', { count: 'exact', head: true });

    const { count: adminsCount } = await supabase
      .from('platform_admins')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: {
        totalOrganizations: orgsCount || 0,
        totalUsers: usersCount || 0,
        totalWorkflows: workflowsCount || 0,
        totalWorkflowRuns: runsCount || 0,
        totalPlatformAdmins: adminsCount || 0,
        systemStatus: 'OPERATIONAL',
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
