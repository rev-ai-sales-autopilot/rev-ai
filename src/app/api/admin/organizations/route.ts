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

    const { data: orgs, error } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_members (id, role, users(email, full_name)),
        workflows (id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    const formatted = (orgs || []).map((o) => {
      const members = o.organization_members || [];
      const ownerMember = members.find((m: { role: string }) => m.role === 'OWNER');
      const ownerUser = ownerMember?.users as unknown as { email?: string; full_name?: string };
      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        industry: o.industry || 'N/A',
        created_at: o.created_at,
        member_count: members.length,
        workflow_count: (o.workflows || []).length,
        owner_name: ownerUser?.full_name || 'N/A',
        owner_email: ownerUser?.email || 'N/A',
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: errMessage } },
      { status: 500 }
    );
  }
}
